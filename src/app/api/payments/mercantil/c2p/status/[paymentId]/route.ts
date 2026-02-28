import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMercantilC2PConfigured, checkC2PStatus } from "@/lib/payments/mercantil-c2p";
import { activateVehicle } from "@/lib/actions/vehicle";
import type { Payment } from "@/types";

type PaymentRow = Pick<Payment, "id" | "status" | "mercantil_transaction_id" | "vehicle_id" | "user_id">;

interface RouteContext {
  params: Promise<{ paymentId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  if (!isMercantilC2PConfigured()) {
    return NextResponse.json(
      { error: "Pago Móvil no disponible por el momento" },
      { status: 503 }
    );
  }

  const { paymentId } = await context.params;

  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Fetch payment (user can only see own payments via RLS)
  const { data: payment } = await supabase
    .from("payments")
    .select("id, status, mercantil_transaction_id, vehicle_id, user_id")
    .eq("id", paymentId)
    .single();

  const typedPayment = payment as PaymentRow | null;

  if (!typedPayment) {
    return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  }

  // If already completed, return immediately
  if (typedPayment.status === "completed") {
    return NextResponse.json({ status: "completed" });
  }

  if (typedPayment.status === "failed") {
    return NextResponse.json({ status: "failed" });
  }

  // Poll Mercantil for status
  if (!typedPayment.mercantil_transaction_id) {
    return NextResponse.json({ status: "pending" });
  }

  try {
    const result = await checkC2PStatus(typedPayment.mercantil_transaction_id);

    if (result.status === "completed") {
      const adminClient = createAdminClient();

      await adminClient
        .from("payments")
        .update({
          status: "completed",
          paid_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      if (typedPayment.vehicle_id) {
        await activateVehicle(typedPayment.vehicle_id);
      }

      return NextResponse.json({ status: "completed" });
    }

    if (result.status === "failed") {
      const adminClient = createAdminClient();
      await adminClient
        .from("payments")
        .update({ status: "failed" })
        .eq("id", paymentId);

      return NextResponse.json({ status: "failed" });
    }

    return NextResponse.json({ status: "pending" });
  } catch (err) {
    console.error("C2P status check error:", err);
    return NextResponse.json({ status: "pending" });
  }
}
