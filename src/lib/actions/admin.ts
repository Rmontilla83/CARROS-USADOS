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
