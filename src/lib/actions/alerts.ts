"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAlertSchema, type CreateAlertData } from "@/lib/validations/alert";
import { MAX_ACTIVE_ALERTS } from "@/lib/constants";
import type { SearchAlert } from "@/types";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function createAlert(data: CreateAlertData): Promise<ActionResult & { alertId?: string }> {
  const parsed = createAlertSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  // Check active alerts limit
  const { count } = await supabase
    .from("search_alerts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  if ((count ?? 0) >= MAX_ACTIVE_ALERTS) {
    return { success: false, error: `Máximo ${MAX_ACTIVE_ALERTS} alertas activas permitidas` };
  }

  const durationDays = parsed.data.durationDays;
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: alert, error } = await supabase
    .from("search_alerts")
    .insert({
      user_id: user.id,
      label: parsed.data.label,
      brand: parsed.data.brand || null,
      model: parsed.data.model || null,
      year_min: parsed.data.yearMin ?? null,
      year_max: parsed.data.yearMax ?? null,
      price_min: parsed.data.priceMin ?? null,
      price_max: parsed.data.priceMax ?? null,
      transmission: parsed.data.transmission || null,
      fuel: parsed.data.fuel || null,
      city: parsed.data.city || null,
      duration_days: durationDays,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Create alert error:", error);
    return { success: false, error: "Error al crear la alerta" };
  }

  revalidatePath("/dashboard/alerts");
  return { success: true, alertId: (alert as { id: string }).id };
}

export async function pauseAlert(alertId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const { error } = await supabase
    .from("search_alerts")
    .update({ status: "paused" })
    .eq("id", alertId)
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) {
    console.error("Pause alert error:", error);
    return { success: false, error: "Error al pausar la alerta" };
  }

  revalidatePath("/dashboard/alerts");
  return { success: true };
}

export async function resumeAlert(alertId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  // Check active alerts limit
  const { count } = await supabase
    .from("search_alerts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  if ((count ?? 0) >= MAX_ACTIVE_ALERTS) {
    return { success: false, error: `Máximo ${MAX_ACTIVE_ALERTS} alertas activas permitidas` };
  }

  // Only resume if not expired
  const { error } = await supabase
    .from("search_alerts")
    .update({ status: "active" })
    .eq("id", alertId)
    .eq("user_id", user.id)
    .eq("status", "paused")
    .gt("expires_at", new Date().toISOString());

  if (error) {
    console.error("Resume alert error:", error);
    return { success: false, error: "Error al reactivar la alerta" };
  }

  revalidatePath("/dashboard/alerts");
  return { success: true };
}

export async function deleteAlert(alertId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const { error } = await supabase
    .from("search_alerts")
    .delete()
    .eq("id", alertId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Delete alert error:", error);
    return { success: false, error: "Error al eliminar la alerta" };
  }

  revalidatePath("/dashboard/alerts");
  return { success: true };
}

export async function getUserAlerts(): Promise<SearchAlert[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("search_alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data as SearchAlert[]) || [];
}
