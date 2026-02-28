import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMercantilCardConfigured, createCardOrder } from "@/lib/payments/mercantil-card";
import { getBcvRate } from "@/lib/payments/bcv-rate";
import { PUBLICATION_PRICE_USD, APP_URL } from "@/lib/constants";
import type { Vehicle } from "@/types";

type VehicleRow = Pick<Vehicle, "id" | "brand" | "model" | "year" | "status" | "user_id">;

export async function POST(request: Request) {
  if (!isMercantilCardConfigured()) {
    return NextResponse.json(
      { error: "Tarjeta Nacional no disponible por el momento" },
      { status: 503 }
    );
  }

  try {
    const { vehicleId } = await request.json();

    if (!vehicleId || typeof vehicleId !== "string") {
      return NextResponse.json({ error: "vehicleId is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id, brand, model, year, status, user_id")
      .eq("id", vehicleId)
      .single();

    const typedVehicle = vehicle as VehicleRow | null;

    if (!typedVehicle || typedVehicle.user_id !== user.id) {
      return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
    }

    if (typedVehicle.status !== "draft") {
      return NextResponse.json({ error: "Este vehículo ya fue publicado" }, { status: 400 });
    }

    const bcvRate = await getBcvRate();
    const amountVes = PUBLICATION_PRICE_USD * bcvRate;
    const vehicleTitle = `${typedVehicle.brand} ${typedVehicle.model} ${typedVehicle.year}`;

    // Create payment record
    const adminClient = createAdminClient();
    const { data: payment, error: paymentError } = await adminClient
      .from("payments")
      .insert({
        user_id: user.id,
        vehicle_id: vehicleId,
        amount: PUBLICATION_PRICE_USD,
        currency: "USD",
        method: "mercantil_card",
        status: "pending",
        bcv_rate: bcvRate,
        amount_ves: amountVes,
        description: `Publicación — ${vehicleTitle}`,
      })
      .select("id")
      .single();

    if (paymentError || !payment) {
      console.error("Payment insert error:", paymentError);
      return NextResponse.json({ error: "Error al crear el pago" }, { status: 500 });
    }

    // Create Mercantil card order
    const order = await createCardOrder({
      amountVes,
      paymentId: payment.id,
      description: `Publicación: ${vehicleTitle}`,
      returnUrl: `${APP_URL}/api/payments/mercantil/card/pay?payment_id=${payment.id}&vehicle_id=${vehicleId}`,
      cancelUrl: `${APP_URL}/checkout/${vehicleId}?cancelled=true`,
    });

    // Store Mercantil transaction ID
    await adminClient
      .from("payments")
      .update({ mercantil_transaction_id: order.orderId })
      .eq("id", payment.id);

    return NextResponse.json({ url: order.paymentUrl });
  } catch (err) {
    console.error("Mercantil card auth error:", err);
    return NextResponse.json({ error: "Error al procesar el pago" }, { status: 500 });
  }
}
