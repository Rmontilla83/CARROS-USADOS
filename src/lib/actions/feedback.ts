"use server";

import { createClient } from "@/lib/supabase/server";
import { feedbackSchema, type FeedbackFormData } from "@/lib/validations/feedback";

export interface FeedbackResult {
  success: boolean;
  error?: string;
}

export async function submitFeedback(
  data: FeedbackFormData
): Promise<FeedbackResult> {
  const parsed = feedbackSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("feedback").insert({
    vehicle_id: parsed.data.vehicle_id,
    price_opinion: parsed.data.price_opinion,
    comment: parsed.data.comment || null,
    source: "web",
  });

  if (error) {
    console.error("Feedback insert error:", error);
    return { success: false, error: "Error al enviar tu opinión." };
  }

  return { success: true };
}
