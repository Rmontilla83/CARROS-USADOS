import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { vehicleExpiredEmail } from "@/lib/email/templates/vehicle-expired";
import { vehicleExpiringEmail } from "@/lib/email/templates/vehicle-expiring";
import type { Vehicle, Profile } from "@/types";

type VehicleWithProfile = Pick<Vehicle, "id" | "brand" | "model" | "year" | "user_id" | "expires_at"> & {
  profiles: Pick<Profile, "email" | "full_name"> | null;
};

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // 1. Find and expire active vehicles past their expiration date
  const { data: expiredVehicles } = await supabase
    .from("vehicles")
    .select("id, brand, model, year, user_id, expires_at, profiles(email, full_name)")
    .eq("status", "active")
    .lt("expires_at", now) as { data: VehicleWithProfile[] | null };

  let expiredCount = 0;
  if (expiredVehicles && expiredVehicles.length > 0) {
    // Update all to expired
    const expiredIds = expiredVehicles.map((v) => v.id);
    await supabase
      .from("vehicles")
      .update({ status: "expired" })
      .in("id", expiredIds);

    expiredCount = expiredIds.length;

    // Send expired emails
    for (const vehicle of expiredVehicles) {
      if (vehicle.profiles?.email) {
        const { subject, html } = vehicleExpiredEmail(
          vehicle.profiles.full_name || "Usuario",
          vehicle.brand,
          vehicle.model,
          vehicle.year,
          vehicle.id
        );
        await sendEmail(vehicle.profiles.email, subject, html);
      }
    }
  }

  // 2. Find vehicles expiring within 7 days and send warning emails
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: expiringVehicles } = await supabase
    .from("vehicles")
    .select("id, brand, model, year, user_id, expires_at, profiles(email, full_name)")
    .eq("status", "active")
    .gt("expires_at", now)
    .lte("expires_at", sevenDaysFromNow) as { data: VehicleWithProfile[] | null };

  let warningCount = 0;
  if (expiringVehicles && expiringVehicles.length > 0) {
    warningCount = expiringVehicles.length;

    for (const vehicle of expiringVehicles) {
      if (vehicle.profiles?.email && vehicle.expires_at) {
        const daysLeft = Math.ceil(
          (new Date(vehicle.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        const { subject, html } = vehicleExpiringEmail(
          vehicle.profiles.full_name || "Usuario",
          vehicle.brand,
          vehicle.model,
          vehicle.year,
          daysLeft,
          vehicle.id
        );
        await sendEmail(vehicle.profiles.email, subject, html);
      }
    }
  }

  return NextResponse.json({
    success: true,
    expired: expiredCount,
    warnings: warningCount,
    timestamp: now,
  });
}
