import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Mark active alerts past their expiration date as expired
  const { data: expiredAlerts } = await supabase
    .from("search_alerts")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("expires_at", now)
    .select("id");

  const expiredCount = expiredAlerts?.length ?? 0;

  return NextResponse.json({
    success: true,
    expired: expiredCount,
    timestamp: now,
  });
}
