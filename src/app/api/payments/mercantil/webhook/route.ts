import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signPayload } from "@/lib/payments/mercantil-auth";
import { activateVehicle } from "@/lib/actions/vehicle";
import type { Payment } from "@/types";

type PaymentRow = Pick<Payment, "id" | "vehicle_id" | "status" | "method">;

/**
 * Mercantil webhook for asynchronous payment notifications.
 * Handles both Card (Botón de Pagos) and C2P (Pago Móvil) events.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const signature = request.headers.get("x-signature") || "";

    // Determine which cipher key to use based on event type
    const isCard = body.payment_method === "card" || body.type === "button_payment";
    const cipherKey = isCard
      ? process.env.MERCANTIL_CARD_CIPHER_KEY
      : process.env.MERCANTIL_C2P_CIPHER_KEY;

    if (!cipherKey) {
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    // Verify signature
    const rawBody = JSON.stringify(body);
    const expectedSignature = signPayload(rawBody, cipherKey);

    if (signature && signature !== expectedSignature) {
      console.error("Mercantil webhook: signature mismatch");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const paymentReference = body.reference || body.payment_id;
    const status = body.status;

    if (!paymentReference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: payment } = await supabase
      .from("payments")
      .select("id, vehicle_id, status, method")
      .eq("id", paymentReference)
      .single();

    const typedPayment = payment as PaymentRow | null;

    if (!typedPayment) {
      console.error("Mercantil webhook: payment not found:", paymentReference);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Idempotent: skip if already completed
    if (typedPayment.status === "completed") {
      return NextResponse.json({ received: true });
    }

    if (status === "completed" || status === "approved" || status === "00") {
      await supabase
        .from("payments")
        .update({
          status: "completed",
          paid_at: new Date().toISOString(),
          mercantil_transaction_id: body.transaction_id || null,
        })
        .eq("id", typedPayment.id);

      if (typedPayment.vehicle_id) {
        await activateVehicle(typedPayment.vehicle_id);
      }
    } else if (status === "failed" || status === "rejected") {
      await supabase
        .from("payments")
        .update({
          status: "failed",
          rejection_reason: body.reason || body.message || null,
        })
        .eq("id", typedPayment.id);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Mercantil webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
