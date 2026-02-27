import { z } from "zod/v4";

export const registerSchema = z.object({
  full_name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre es muy largo"),
  email: z.email("Ingresa un email válido"),
  phone: z
    .string()
    .regex(
      /^\+58\s?\(?\d{3}\)?\s?\d{3}-?\d{4}$/,
      "Formato válido: +58 (412) 123-4567"
    ),
  cedula: z
    .string()
    .regex(
      /^[VE]-?\d{6,9}$/,
      "Formato válido: V-12345678 o E-12345678"
    ),
  city: z.string().min(1, "Selecciona una ciudad"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("Ingresa un email válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
