import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import { PUBLICATION_PRICE_USD, APP_URL } from "@/lib/constants";
import type { Vehicle } from "@/types";

type VehicleRow = Pick<Vehicle, "id" | "brand" | "model" | "year" | "status" | "user_id">;

export async function POST(request: Request) {
  try {
    const { vehicleId } = await request.json();

    if (!vehicleId || typeof vehicleId !== "string") {
      return NextResponse.json({ error: "vehicleId is required" }, { status: 400 });
    }

    // Auth check
    console.log("[stripe/create-session] Step 1: Auth check");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verify vehicle is draft and owned by user
    console.log("[stripe/create-session] Step 2: Vehicle check for", vehicleId);
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("id, brand, model, year, status, user_id")
      .eq("id", vehicleId)
      .single();

    if (vehicleError) {
      console.error("[stripe/create-session] Vehicle query error:", vehicleError);
    }

    const typedVehicle = vehicle as VehicleRow | null;

    if (!typedVehicle || typedVehicle.user_id !== user.id) {
      return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
    }

    if (typedVehicle.status !== "draft") {
      return NextResponse.json(
        { error: `Este vehículo tiene estado "${typedVehicle.status}", se esperaba "draft"` },
        { status: 400 }
      );
    }

    // Check for existing pending payment to avoid duplicates
    console.log("[stripe/create-session] Step 3: Check existing payment");
    const adminClient = createAdminClient();
    const { data: existingPayment } = await adminClient
      .from("payments")
      .select("id, stripe_session_id")
      .eq("vehicle_id", vehicleId)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .eq("method", "stripe")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Create payment record via admin client (RLS only allows user SELECT)
    let paymentId: string;

    if (existingPayment) {
      paymentId = existingPayment.id;
      console.log("[stripe/create-session] Reusing existing payment:", paymentId);
    } else {
      console.log("[stripe/create-session] Step 4: Insert payment record");
      const { data: payment, error: paymentError } = await adminClient
        .from("payments")
        .insert({
          user_id: user.id,
          vehicle_id: vehicleId,
          amount: PUBLICATION_PRICE_USD,
          currency: "USD",
          method: "stripe",
          status: "pending",
          description: `Publicación — ${typedVehicle.brand} ${typedVehicle.model} ${typedVehicle.year}`,
        })
        .select("id")
        .single();

      if (paymentError || !payment) {
        console.error("[stripe/create-session] Payment insert error:", JSON.stringify(paymentError));
        return NextResponse.json({ error: "Error al crear el pago" }, { status: 500 });
      }

      paymentId = payment.id;
      console.log("[stripe/create-session] Payment created:", paymentId);
    }

    // Create Stripe Checkout Session
    console.log("[stripe/create-session] Step 5: Create Stripe session. APP_URL:", APP_URL);
    const stripe = getStripe();
    const vehicleTitle = `${typedVehicle.brand} ${typedVehicle.model} ${typedVehicle.year}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Publicación: ${vehicleTitle}`,
              description: "Publicación de vehículo por 60 días en CarrosUsados",
            },
            unit_amount: PUBLICATION_PRICE_USD * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        payment_id: paymentId,
        vehicle_id: vehicleId,
        user_id: user.id,
      },
      success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&vehicle_id=${vehicleId}`,
      cancel_url: `${APP_URL}/checkout/${vehicleId}?cancelled=true`,
    });

    // Update payment with Stripe session ID
    await adminClient
      .from("payments")
      .update({ stripe_session_id: session.id })
      .eq("id", paymentId);

    console.log("[stripe/create-session] Success. Session URL generated.");
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    console.error("[stripe/create-session] FATAL:", errorMsg);
    if (errorStack) console.error("[stripe/create-session] Stack:", errorStack);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
