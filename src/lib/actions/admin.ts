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
  siteUrl?: string;
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
      siteUrl: APP_URL,
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

  try {
    const supabase = await createClient();

    // Gather platform stats — each query wrapped to avoid one failure breaking all
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const weekAgoStr = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];

    const safeCount = async (
      table: string,
      filter?: { col: string; val: string }
    ): Promise<number> => {
      let q = supabase.from(table).select("*", { count: "exact", head: true });
      if (filter) q = q.eq(filter.col, filter.val);
      const { count } = await q;
      return count || 0;
    };

    const [totalVehicles, activeVehicles, soldVehicles, totalUsers, pendingQr] =
      await Promise.all([
        safeCount("vehicles"),
        safeCount("vehicles", { col: "status", val: "active" }),
        safeCount("vehicles", { col: "status", val: "sold" }),
        safeCount("profiles"),
        safeCount("qr_orders", { col: "status", val: "pending" }),
      ]);

    // Recent vehicles (safe)
    const { data: recentVehicles } = await supabase
      .from("vehicles")
      .select("brand, model, year, price, views_count, status, created_at")
      .gte("created_at", weekAgoStr)
      .order("created_at", { ascending: false })
      .limit(20);

    // Feedback summary (may be empty)
    const { data: recentFeedback } = await supabase
      .from("feedback")
      .select("price_opinion")
      .gte("created_at", weekAgoStr)
      .limit(50);

    const feedbackSummary = (recentFeedback || []).reduce(
      (acc, f) => {
        const opinion = (f as { price_opinion: string }).price_opinion;
        acc[opinion] = (acc[opinion] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const vehiclesList = (recentVehicles || [])
      .slice(0, 10)
      .map((v) => {
        const veh = v as { brand: string; model: string; year: number; price: number; views_count: number; status: string };
        return `${veh.brand} ${veh.model} ${veh.year} - $${veh.price} (${veh.views_count} visitas, ${veh.status})`;
      })
      .join("\n");

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return { success: false, error: "API de IA no configurada" };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Eres el analista de datos de CarrosUsados, un marketplace de vehículos usados en Venezuela (Anzoátegui). Genera un insight diario breve y accionable para el equipo admin.

Datos de hoy (${todayStr}):
- Total publicaciones: ${totalVehicles}
- Publicaciones activas: ${activeVehicles}
- Vehículos vendidos: ${soldVehicles}
- Usuarios registrados: ${totalUsers}
- QR pendientes de imprimir: ${pendingQr}
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
    const message = err instanceof Error ? err.message : "No se pudo generar el insight.";
    return { success: false, error: message };
  }
}
