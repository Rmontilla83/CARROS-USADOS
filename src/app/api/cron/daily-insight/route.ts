import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_AI_API_KEY not configured" }, { status: 500 });
  }

  const supabase = createAdminClient();

  // Gather platform stats for insight generation
  const [
    { count: totalVehicles },
    { count: activeVehicles },
    { data: recentVehicles },
    { count: totalPayments },
  ] = await Promise.all([
    supabase.from("vehicles").select("*", { count: "exact", head: true }),
    supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("vehicles")
      .select("brand, model, year, price")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("payments").select("*", { count: "exact", head: true }).eq("status", "completed"),
  ]);

  const vehicleList = (recentVehicles || [])
    .map((v) => `${v.brand} ${v.model} ${v.year} - $${v.price}`)
    .join("\n");

  const prompt = `Eres el asistente de inteligencia de negocio de CarrosUsados, una plataforma venezolana de venta de vehiculos usados con QR.

ESTADISTICAS ACTUALES:
- Vehiculos totales: ${totalVehicles || 0}
- Vehiculos activos: ${activeVehicles || 0}
- Pagos completados: ${totalPayments || 0}

VEHICULOS RECIENTES ACTIVOS:
${vehicleList || "Ninguno aún"}

Genera un insight diario breve (2-3 oraciones en espanol) sobre el estado del marketplace. Puede ser sobre tendencias de marcas, rango de precios, oportunidades de crecimiento, o recomendaciones operativas. Se conciso y accionable. Responde SOLO con el texto del insight, sin formato markdown ni prefijos.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const insight = result.response.text().trim();

    // Store the insight in analytics_events for the admin dashboard to read
    await supabase.from("analytics_events").insert({
      event_type: "daily_insight",
      metadata: {
        insight,
        total_vehicles: totalVehicles || 0,
        active_vehicles: activeVehicles || 0,
        total_payments: totalPayments || 0,
        generated_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      insight,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Daily insight generation failed:", err);
    return NextResponse.json({ error: "Insight generation failed" }, { status: 500 });
  }
}
