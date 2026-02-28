import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { activateVehicle } from "@/lib/actions/vehicle";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const paymentId = session.metadata?.payment_id;
    const vehicleId = session.metadata?.vehicle_id;

    if (!paymentId || !vehicleId) {
      console.error("Webhook missing metadata:", session.metadata);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

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
      console.error("Payment update error:", updateError);
      return NextResponse.json({ error: "Payment update failed" }, { status: 500 });
    }

    // Activate the vehicle (idempotent)
    const result = await activateVehicle(vehicleId);
    if (!result.success) {
      console.error("Vehicle activation error:", result.error);
      // Don't return error — payment is already completed
    }
  }

  return NextResponse.json({ received: true });
}
