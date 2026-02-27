import { z } from "zod/v4";
import {
  MIN_YEAR,
  MAX_YEAR,
  MIN_PHOTOS,
  MAX_PHOTOS,
} from "@/lib/constants";

export const vehicleDataSchema = z.object({
  brand: z.string().min(1, "Selecciona una marca"),
  model: z.string().min(1, "Ingresa el modelo").max(100),
  year: z
    .number({ error: "Ingresa el año" })
    .int()
    .min(MIN_YEAR, `Año mínimo: ${MIN_YEAR}`)
    .max(MAX_YEAR, `Año máximo: ${MAX_YEAR}`),
  mileage: z
    .number({ error: "Ingresa el kilometraje" })
    .int()
    .min(0, "El kilometraje no puede ser negativo")
    .max(999999, "Kilometraje inválido"),
  color: z.string().min(1, "Ingresa el color"),
  transmission: z.enum(["automatic", "manual", "cvt"], {
    error: "Selecciona la transmisión",
  }),
  fuel: z.enum(["gasoline", "diesel", "electric", "hybrid", "gas"], {
    error: "Selecciona el combustible",
  }),
  plate: z.string().max(10).optional().or(z.literal("")),
  engine: z.string().max(50).optional().or(z.literal("")),
  doors: z.number().int().min(2).max(6),
});

export type VehicleDataFormData = z.infer<typeof vehicleDataSchema>;

export const vehiclePriceSchema = z.object({
  price: z
    .number({ error: "Ingresa el precio" })
    .positive("El precio debe ser mayor a 0")
    .max(999999, "Precio inválido"),
});

export type VehiclePriceFormData = z.infer<typeof vehiclePriceSchema>;

export const vehicleDescriptionSchema = z.object({
  description: z.string().max(2000, "Máximo 2000 caracteres").optional().or(z.literal("")),
  conditions: z.record(z.string(), z.boolean()),
});

export type VehicleDescriptionFormData = z.infer<typeof vehicleDescriptionSchema>;

// Full vehicle for submission
export const publishVehicleSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int(),
  mileage: z.number().int().min(0),
  color: z.string().min(1),
  transmission: z.enum(["automatic", "manual", "cvt"]),
  fuel: z.enum(["gasoline", "diesel", "electric", "hybrid", "gas"]),
  plate: z.string().optional(),
  engine: z.string().optional(),
  doors: z.number().int().min(2).max(6),
  price: z.number().positive(),
  description: z.string().optional(),
  conditions: z.record(z.string(), z.boolean()),
  photoStoragePaths: z.array(z.string()).min(MIN_PHOTOS).max(MAX_PHOTOS),
  coverPhotoIndex: z.number().int().min(0),
  videoStoragePath: z.string().optional(),
});

export type PublishVehicleData = z.infer<typeof publishVehicleSchema>;
