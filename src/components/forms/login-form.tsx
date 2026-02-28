"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Car } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    setServerError(null);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setIsLoading(false);
      if (error.message.includes("Invalid login")) {
        setServerError("Email o contraseña incorrectos.");
        return;
      }
      setServerError(error.message);
      return;
    }

    router.push(redirectTo);
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
          <h2 className="text-3xl font-bold text-white">Bienvenido de vuelta</h2>
          <p className="mt-3 text-lg text-white/70">
            Gestiona tus publicaciones, revisa tus analytics y conecta con compradores.
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

          <h1 className="text-2xl font-bold text-foreground">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresa a tu cuenta para gestionar tus vehículos
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {serverError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

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

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Tu contraseña"
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
              {isLoading ? "Ingresando..." : "Iniciar sesión"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="font-semibold text-accent hover:underline">
              Regístrate aquí
            </Link>
          </p>

          <Link
            href="/"
            className="mt-8 block text-center text-xs text-muted-foreground hover:text-foreground"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
