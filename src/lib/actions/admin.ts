"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { VehicleStatus, QrOrderStatus, Profile } from "@/types";

interface ActionResult {
  success: boolean;
  error?: string;
}

async function requireAdmin(): Promise<{ userId: string } | ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile as Pick<Profile, "role">).role !== "admin") {
    return { success: false, error: "No autorizado" };
  }

  return { userId: user.id };
}

/**
 * Update a vehicle's status (approve, reject, etc.)
 */
export async function updateVehicleStatus(
  vehicleId: string,
  status: VehicleStatus
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth as ActionResult;

  const supabase = await createClient();

  const updateData: Record<string, string> = { status };
  if (status === "active") {
    updateData.published_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("vehicles")
    .update(updateData)
    .eq("id", vehicleId);

  if (error) {
    console.error("Update vehicle status error:", error);
    return { success: false, error: "Error al actualizar el estado." };
  }

  revalidatePath("/admin/vehicles");
  return { success: true };
}

/**
 * Update a QR order status.
 */
export async function updateQrOrderStatus(
  orderId: string,
  status: QrOrderStatus
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth as ActionResult;

  const supabase = await createClient();

  const updateData: Record<string, string> = { status };
  if (status === "printed") {
    updateData.printed_at = new Date().toISOString();
  } else if (status === "delivered") {
    updateData.delivered_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("qr_orders")
    .update(updateData)
    .eq("id", orderId);

  if (error) {
    console.error("Update QR order status error:", error);
    return { success: false, error: "Error al actualizar la orden." };
  }

  revalidatePath("/admin/qr-orders");
  return { success: true };
}

/**
 * Assign a courier to a QR order.
 */
export async function assignCourier(
  orderId: string,
  courierId: string
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth as ActionResult;

  const supabase = await createClient();

  const { error } = await supabase
    .from("qr_orders")
    .update({
      courier_id: courierId,
      status: "assigned",
      assigned_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    console.error("Assign courier error:", error);
    return { success: false, error: "Error al asignar motorizado." };
  }

  revalidatePath("/admin/qr-orders");
  return { success: true };
}

/**
 * Generate a QR code data URL for a vehicle slug.
 */
export async function generateQrPreview(
  slug: string
): Promise<{
  success: boolean;
  qrDataUrl?: string;
  vehicleUrl?: string;
  error?: string;
}> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: (auth as ActionResult).error };

  const { generateQrDataUrl } = await import("@/lib/qr/generate");
  const { APP_URL } = await import("@/lib/constants");

  try {
    const qrDataUrl = await generateQrDataUrl(slug);
    return {
      success: true,
      qrDataUrl,
      vehicleUrl: `${APP_URL}/${slug}`,
    };
  } catch (err) {
    console.error("QR preview error:", err);
    return { success: false, error: "Error al generar el QR." };
  }
}

/**
 * Generate a daily AI insight about platform performance.
 */
export async function generateDailyInsight(): Promise<{
  success: boolean;
  insight?: string;
  error?: string;
}> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: (auth as ActionResult).error };

  const supabase = await createClient();

  // Gather platform stats for AI analysis
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split("T")[0];
  const weekAgoStr = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];

  const [
    { count: totalVehicles },
    { count: activeVehicles },
    { count: soldVehicles },
    { count: totalUsers },
    { count: pendingQr },
    { data: recentVehicles },
    { data: recentFeedback },
    { count: todayViews },
    { count: weekViews },
  ] = await Promise.all([
    supabase.from("vehicles").select("*", { count: "exact", head: true }),
    supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "sold"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("qr_orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("vehicles")
      .select("brand, model, year, price, views_count, status, created_at")
      .gte("created_at", weekAgoStr)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("feedback")
      .select("price_opinion, rating")
      .gte("created_at", weekAgoStr)
      .limit(50),
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "vehicle_view")
      .gte("created_at", todayStr),
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "vehicle_view")
      .gte("created_at", weekAgoStr),
  ]);

  // Calculate feedback summary
  const feedbackSummary = (recentFeedback || []).reduce(
    (acc, f) => {
      const opinion = (f as { price_opinion: string }).price_opinion;
      acc[opinion] = (acc[opinion] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Recent vehicles summary
  const vehiclesList = (recentVehicles || [])
    .slice(0, 10)
    .map((v) => {
      const veh = v as { brand: string; model: string; year: number; price: number; views_count: number; status: string };
      return `${veh.brand} ${veh.model} ${veh.year} - $${veh.price} (${veh.views_count} visitas, ${veh.status})`;
    })
    .join("\n");

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return { success: false, error: "API de IA no configurada" };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Eres el analista de datos de CarrosUsados, un marketplace de vehículos usados en Venezuela (Anzoátegui). Genera un insight diario breve y accionable para el equipo admin.

Datos de hoy (${todayStr}):
- Total publicaciones: ${totalVehicles || 0}
- Publicaciones activas: ${activeVehicles || 0}
- Vehículos vendidos: ${soldVehicles || 0}
- Usuarios registrados: ${totalUsers || 0}
- QR pendientes de imprimir: ${pendingQr || 0}
- Visitas hoy: ${todayViews || 0}
- Visitas últimos 7 días: ${weekViews || 0}
- Feedback de compradores esta semana: ${JSON.stringify(feedbackSummary)}

Publicaciones recientes:
${vehiclesList || "Ninguna esta semana"}

Genera un párrafo conciso (máximo 3-4 oraciones) en español con:
1. Un resumen del estado actual de la plataforma
2. Una observación o tendencia relevante
3. Una recomendación accionable para el equipo

Responde SOLO con el texto del insight, sin formato markdown, sin comillas, sin encabezados.`;

    const result = await model.generateContent(prompt);
    const insight = result.response.text().trim();

    return { success: true, insight };
  } catch (err) {
    console.error("AI insight error:", err);
    return { success: false, error: "No se pudo generar el insight." };
  }
}
