import { z } from "zod/v4";

export const createAlertSchema = z.object({
  label: z.string().min(1, "Dale un nombre a tu alerta").max(100),
  brand: z.string().optional(),
  model: z.string().max(100).optional(),
  yearMin: z.number().int().min(1970).optional(),
  yearMax: z.number().int().max(2027).optional(),
  priceMin: z.number().positive().optional(),
  priceMax: z.number().positive().optional(),
  transmission: z.enum(["automatic", "manual", "cvt"]).optional(),
  fuel: z.enum(["gasoline", "diesel", "electric", "hybrid", "gas"]).optional(),
  city: z.string().optional(),
  durationDays: z.enum(["30", "60", "90"]).transform(Number),
});

export type CreateAlertData = z.input<typeof createAlertSchema>;
