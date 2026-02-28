import { z } from "zod/v4";

export const feedbackSchema = z.object({
  vehicle_id: z.string().uuid(),
  price_opinion: z.enum(["fair", "too_expensive", "good_deal", "no_opinion"]),
  comment: z.string().max(500).optional().or(z.literal("")),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;
