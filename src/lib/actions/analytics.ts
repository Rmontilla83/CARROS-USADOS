"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function trackView(vehicleId: string): Promise<void> {
  const supabase = await createClient();
  const headersList = await headers();

  const userAgent = headersList.get("user-agent") || null;
  const referrer = headersList.get("referer") || null;

  // Log analytics event
  await supabase.from("analytics_events").insert({
    vehicle_id: vehicleId,
    event_type: "view",
    user_agent: userAgent,
    referrer: referrer,
    metadata: {},
  });

  // Increment view counter via RPC
  await supabase.rpc("increment_vehicle_views", {
    vehicle_uuid: vehicleId,
  });
}
