"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  canModerateVehicles,
  canAssignCourier,
  canApprovePayments,
  canViewDashboard,
  canChangeRoles,
  canCreateUsers,
  canDeleteUsers,
} from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VehicleStatus, QrOrderStatus, Profile, UserRole } from "@/types";

interface ActionResult {
  success: boolean;
  error?: string;
}

type AuthSuccess = { ok: true; userId: string; role: UserRole };
type AuthFailure = { ok: false; result: ActionResult };
type AuthResult = AuthSuccess | AuthFailure;

async function requireRole(
  ...allowedRoles: UserRole[]
): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, result: { success: false, error: "No autenticado" } };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as Pick<Profile, "role"> | null)?.role;
  if (!role || !allowedRoles.includes(role)) {
    return { ok: false, result: { success: false, error: "No autorizado" } };
  }

  return { ok: true, userId: user.id, role };
}

/**
 * Update a vehicle's status (approve, reject, etc.)
 */
export async function updateVehicleStatus(
  vehicleId: string,
  status: VehicleStatus
): Promise<ActionResult> {
  const auth = await requireRole("admin", "moderator");
  if (!auth.ok) return auth.result;

  if (!canModerateVehicles(auth.role)) {
    return { success: false, error: "No autorizado para moderar vehículos" };
  }

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
  const auth = await requireRole("admin", "printer", "courier");
  if (!auth.ok) return auth.result;

  // Courier can only mark as delivered and only their own orders
  if (auth.role === "courier") {
    if (status !== "delivered") {
      return { success: false, error: "Solo puedes marcar como entregado" };
    }
    const supabase = await createClient();
    const { data: order } = await supabase
      .from("qr_orders")
      .select("courier_id")
      .eq("id", orderId)
      .single();

    if (!order || (order as { courier_id: string | null }).courier_id !== auth.userId) {
      return { success: false, error: "Solo puedes actualizar tus órdenes asignadas" };
    }
  }

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
  const auth = await requireRole("admin", "printer");
  if (!auth.ok) return auth.result;

  if (!canAssignCourier(auth.role)) {
    return { success: false, error: "No autorizado para asignar motorizados" };
  }

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
  const auth = await requireRole("admin", "printer");
  if (!auth.ok) return { success: false, error: auth.result.error };

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
  const auth = await requireRole("admin", "analyst");
  if (!auth.ok) return { success: false, error: auth.result.error };

  if (!canViewDashboard(auth.role)) {
    return { success: false, error: "No autorizado" };
  }

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

/**
 * Update a user's role. Admin only.
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<ActionResult> {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.result;

  if (!canChangeRoles(auth.role)) {
    return { success: false, error: "No autorizado para cambiar roles" };
  }

  // Prevent admin from changing their own role
  if (auth.userId === userId) {
    return { success: false, error: "No puedes cambiar tu propio rol" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    console.error("Update user role error:", error);
    return { success: false, error: "Error al actualizar el rol." };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * Approve a pending payment. Admin or support.
 */
export async function approvePayment(
  paymentId: string
): Promise<ActionResult> {
  const auth = await requireRole("admin", "support");
  if (!auth.ok) return auth.result;

  if (!canApprovePayments(auth.role)) {
    return { success: false, error: "No autorizado para aprobar pagos" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("payments")
    .update({
      status: "completed",
      verified_by: auth.userId,
      verified_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("status", "pending");

  if (error) {
    console.error("Approve payment error:", error);
    return { success: false, error: "Error al aprobar el pago." };
  }

  revalidatePath("/admin/payments");
  return { success: true };
}

/**
 * Reject a pending payment with a reason. Admin or support.
 */
export async function rejectPayment(
  paymentId: string,
  reason: string
): Promise<ActionResult> {
  const auth = await requireRole("admin", "support");
  if (!auth.ok) return auth.result;

  if (!canApprovePayments(auth.role)) {
    return { success: false, error: "No autorizado para rechazar pagos" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("payments")
    .update({
      status: "failed",
      verified_by: auth.userId,
      verified_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq("id", paymentId)
    .eq("status", "pending");

  if (error) {
    console.error("Reject payment error:", error);
    return { success: false, error: "Error al rechazar el pago." };
  }

  revalidatePath("/admin/payments");
  return { success: true };
}

/**
 * Create an internal team user. Admin only.
 */
export async function createInternalUser({
  fullName,
  email,
  password,
  role,
}: {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<ActionResult> {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.result;

  if (!canCreateUsers(auth.role)) {
    return { success: false, error: "No autorizado para crear usuarios" };
  }

  const adminClient = createAdminClient();

  // Create auth user — the DB trigger will auto-create a profile with role "seller"
  const { data, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError) {
    console.error("Create internal user error:", createError);
    return { success: false, error: createError.message };
  }

  // Update the profile to the chosen internal role (trigger defaults to seller)
  const { error: updateError } = await adminClient
    .from("profiles")
    .update({ role })
    .eq("id", data.user.id);

  if (updateError) {
    console.error("Update new user role error:", updateError);
    return { success: false, error: "Usuario creado pero no se pudo asignar el rol." };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * Delete a user. Admin only.
 */
export async function deleteUser(userId: string): Promise<ActionResult> {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.result;

  if (!canDeleteUsers(auth.role)) {
    return { success: false, error: "No autorizado para eliminar usuarios" };
  }

  if (auth.userId === userId) {
    return { success: false, error: "No puedes eliminarte a ti mismo" };
  }

  const adminClient = createAdminClient();

  // Delete profile first, then auth user
  const { error: profileError } = await adminClient
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileError) {
    console.error("Delete profile error:", profileError);
    return { success: false, error: "Error al eliminar el perfil." };
  }

  const { error: authError } = await adminClient.auth.admin.deleteUser(userId);

  if (authError) {
    console.error("Delete auth user error:", authError);
    return { success: false, error: "Perfil eliminado pero error al eliminar cuenta auth." };
  }

  revalidatePath("/admin/users");
  return { success: true };
}
