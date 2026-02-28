import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMercantilCardConfigured, verifyCardCallback } from "@/lib/payments/mercantil-card";
import { activateVehicle } from "@/lib/actions/vehicle";
import { APP_URL } from "@/lib/constants";

/**
 * Mercantil redirects the customer here after card payment.
 * We verify the signature, update the payment, and activate the vehicle.
 */
export async function GET(request: NextRequest) {
  if (!isMercantilCardConfigured()) {
    return NextResponse.redirect(`${APP_URL}/dashboard`);
  }

  const searchParams = request.nextUrl.searchParams;
  const paymentId = searchParams.get("payment_id");
  const vehicleId = searchParams.get("vehicle_id");
  const signature = searchParams.get("signature") || "";
  const status = searchParams.get("status");

  if (!paymentId || !vehicleId) {
    return NextResponse.redirect(`${APP_URL}/dashboard`);
  }

  const supabase = createAdminClient();

  // If Mercantil sends a signature, verify it
  if (signature) {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== "signature") params[key] = value;
    });

    const result = verifyCardCallback(params, signature);
    if (!result) {
      console.error("Mercantil card callback: invalid signature");
      return NextResponse.redirect(`${APP_URL}/checkout/${vehicleId}?cancelled=true`);
    }
  }

  if (status === "completed" || status === "approved" || status === "00") {
    // Payment successful
    await supabase
      .from("payments")
      .update({
        status: "completed",
        paid_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    await activateVehicle(vehicleId);

    return NextResponse.redirect(
      `${APP_URL}/checkout/success?vehicle_id=${vehicleId}`
    );
  }

  // Payment failed or cancelled
  await supabase
    .from("payments")
    .update({ status: "failed" })
    .eq("id", paymentId);

  return NextResponse.redirect(`${APP_URL}/checkout/${vehicleId}?cancelled=true`);
}
