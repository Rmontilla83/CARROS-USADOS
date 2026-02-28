"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Car } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";

const ANZOATEGUI_CITIES = [
  "Barcelona",
  "Puerto La Cruz",
  "Lechería",
  "El Tigre",
  "Anaco",
  "Cantaura",
  "Puerto Píritu",
  "Guanta",
  "Clarines",
  "Pariaguán",
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phone: "+58 ",
    },
  });

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);
    setServerError(null);

    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          phone: data.phone,
          cedula: data.cedula,
          city: data.city,
        },
      },
    });

    if (signUpError) {
      setIsLoading(false);
      if (signUpError.message.includes("already registered")) {
        setServerError(
          "Este email ya está registrado. Intenta iniciar sesión."
        );
        return;
      }
      setServerError(signUpError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel - decorative (hidden on mobile) */}
      <div className="hidden w-1/2 bg-gradient-to-br from-[#1B4F72] via-[#1a5276] to-[#2E86C1] lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <Car className="size-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Comienza a vender hoy</h2>
          <p className="mt-3 text-lg text-white/70">
            Crea tu cuenta en minutos y publica tu primer vehículo. Tu carro es tu mejor vitrina.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-4 py-8 sm:px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="rounded-lg bg-primary p-1.5">
              <Car className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">CarrosUsados</span>
          </Link>

          <h1 className="text-2xl font-bold text-foreground">Crear cuenta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Regístrate para publicar tu vehículo
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {serverError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                placeholder="Juan Pérez"
                className="h-11"
                {...register("full_name")}
                aria-invalid={!!errors.full_name}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                className="h-11"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Phone + Cedula row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+58 412 1234567"
                  className="h-11"
                  {...register("phone")}
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cedula">Cédula</Label>
                <Input
                  id="cedula"
                  placeholder="V-12345678"
                  className="h-11"
                  {...register("cedula")}
                  aria-invalid={!!errors.cedula}
                />
                {errors.cedula && (
                  <p className="text-sm text-destructive">{errors.cedula.message}</p>
                )}
              </div>
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Select onValueChange={(value) => setValue("city", value)}>
                <SelectTrigger className="h-11 w-full" aria-invalid={!!errors.city}>
                  <SelectValue placeholder="Selecciona tu ciudad" />
                </SelectTrigger>
                <SelectContent>
                  {ANZOATEGUI_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                className="h-11"
                {...register("password")}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="h-12 w-full bg-accent text-base font-semibold text-white shadow-lg shadow-accent/25 hover:bg-accent/90"
              disabled={isLoading}
            >
              {isLoading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-accent hover:underline">
              Iniciar sesión
            </Link>
          </p>

          <Link
            href="/"
            className="mt-6 block text-center text-xs text-muted-foreground hover:text-foreground"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
