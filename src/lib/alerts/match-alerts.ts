import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { alertMatchEmail } from "@/lib/email/templates/alert-match";
import type { Vehicle, SearchAlert, Profile } from "@/types";

type ActiveVehicle = Pick<
  Vehicle,
  "id" | "brand" | "model" | "year" | "price" | "transmission" | "fuel" | "slug" | "user_id"
>;

/**
 * Match a newly activated vehicle against all active alerts and notify users.
 * Called fire-and-forget when a vehicle becomes active.
 */
export async function matchAndNotifyAlerts(vehicle: ActiveVehicle): Promise<void> {
  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // Find active, non-expired alerts (excluding the vehicle's own seller)
    const { data: alerts } = await supabase
      .from("search_alerts")
      .select("*")
      .eq("status", "active")
      .gt("expires_at", now)
      .neq("user_id", vehicle.user_id);

    if (!alerts || alerts.length === 0) return;

    const matchingAlerts: SearchAlert[] = [];

    for (const raw of alerts) {
      const alert = raw as SearchAlert;

      // Filter by brand
      if (alert.brand && alert.brand.toLowerCase() !== vehicle.brand.toLowerCase()) continue;

      // Filter by model
      if (alert.model && !vehicle.model.toLowerCase().includes(alert.model.toLowerCase())) continue;

      // Filter by year range
      if (alert.year_min != null && vehicle.year < alert.year_min) continue;
      if (alert.year_max != null && vehicle.year > alert.year_max) continue;

      // Filter by price range
      if (alert.price_min != null && vehicle.price < alert.price_min) continue;
      if (alert.price_max != null && vehicle.price > alert.price_max) continue;

      // Filter by transmission
      if (alert.transmission && alert.transmission !== vehicle.transmission) continue;

      // Filter by fuel
      if (alert.fuel && alert.fuel !== vehicle.fuel) continue;

      matchingAlerts.push(alert);
    }

    if (matchingAlerts.length === 0) return;

    // Get user profiles for matched alerts
    const userIds = [...new Set(matchingAlerts.map((a) => a.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    const profileMap = new Map<string, Pick<Profile, "email" | "full_name">>();
    if (profiles) {
      for (const p of profiles as Pick<Profile, "id" | "email" | "full_name">[]) {
        profileMap.set(p.id, p);
      }
    }

    // Send notifications for each matching alert
    for (const alert of matchingAlerts) {
      // Check dedup: has this alert already been notified for this vehicle?
      const { data: existing } = await supabase
        .from("alert_notifications")
        .select("id")
        .eq("alert_id", alert.id)
        .eq("vehicle_id", vehicle.id)
        .single();

      if (existing) continue;

      // Record notification (dedup)
      const { error: insertError } = await supabase
        .from("alert_notifications")
        .insert({ alert_id: alert.id, vehicle_id: vehicle.id });

      if (insertError) {
        console.error("Alert notification insert error:", insertError);
        continue;
      }

      // Update alert notification count
      await supabase
        .from("search_alerts")
        .update({
          notification_count: alert.notification_count + 1,
          last_notified_at: now,
        })
        .eq("id", alert.id);

      // Send email
      const profile = profileMap.get(alert.user_id);
      if (profile?.email) {
        const vehicleTitle = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
        const { subject, html } = alertMatchEmail(
          profile.full_name || "Usuario",
          alert.label,
          vehicleTitle,
          vehicle.price,
          vehicle.slug,
          alert.unsubscribe_token
        );
        await sendEmail(profile.email, subject, html);
      }
    }
  } catch (err) {
    console.error("matchAndNotifyAlerts error:", err);
  }
}
