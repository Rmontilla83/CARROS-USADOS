import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_NAME, APP_URL } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Find and pause the alert by unsubscribe token
  const { data: alert, error } = await supabase
    .from("search_alerts")
    .update({ status: "paused" })
    .eq("unsubscribe_token", token)
    .eq("status", "active")
    .select("id, label")
    .single();

  const alertLabel = (alert as { label: string } | null)?.label ?? "tu alerta";

  // Redirect to a confirmation page (HTML response)
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Alerta pausada — ${APP_NAME}</title>
</head>
<body style="margin:0;padding:40px 20px;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;text-align:center;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="color:#1B4F72;font-size:24px;margin:0 0 16px;">${APP_NAME}</h1>
    ${error
      ? '<p style="color:#dc2626;font-size:16px;">No se encontró la alerta o ya estaba pausada.</p>'
      : `<p style="color:#27AE60;font-size:20px;font-weight:bold;margin:0 0 8px;">Alerta pausada</p>
         <p style="color:#4a4a4a;font-size:15px;">La alerta <strong>"${alertLabel}"</strong> ha sido pausada. No recibirás más notificaciones de esta alerta.</p>
         <p style="color:#9ca3af;font-size:13px;margin-top:16px;">Puedes reactivarla desde tu <a href="${APP_URL}/dashboard/alerts" style="color:#1B4F72;">panel de alertas</a>.</p>`
    }
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
