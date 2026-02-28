import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { activateVehicle } from "@/lib/actions/vehicle";

export async function POST(request: Request) {
  console.log("[stripe/webhook] Received webhook");

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error("[stripe/webhook] Missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe/webhook] Signature verification failed:", msg);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("[stripe/webhook] Event type:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const paymentId = session.metadata?.payment_id;
    const vehicleId = session.metadata?.vehicle_id;

    if (!paymentId || !vehicleId) {
      console.error("[stripe/webhook] Missing metadata:", JSON.stringify(session.metadata));
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    console.log("[stripe/webhook] Processing payment:", paymentId, "vehicle:", vehicleId);

    const supabase = createAdminClient();

    // Update payment to completed
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "completed",
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq("id", paymentId);

    if (updateError) {
      console.error("[stripe/webhook] Payment update error:", JSON.stringify(updateError));
      return NextResponse.json({ error: "Payment update failed" }, { status: 500 });
    }

    console.log("[stripe/webhook] Payment updated. Activating vehicle...");

    // Activate the vehicle (idempotent)
    const result = await activateVehicle(vehicleId);
    if (!result.success) {
      console.error("[stripe/webhook] Vehicle activation error:", result.error);
      // Don't return error — payment is already completed
    } else {
      console.log("[stripe/webhook] Vehicle activated successfully");
    }
  }

  return NextResponse.json({ received: true });
}
