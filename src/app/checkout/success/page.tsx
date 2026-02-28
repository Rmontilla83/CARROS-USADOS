import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, Clock, CreditCard, Send, QrCode, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { Vehicle } from "@/types";

export const metadata: Metadata = {
  title: "Pago Exitoso",
};

type VehicleRow = Pick<Vehicle, "id" | "brand" | "model" | "year" | "slug" | "status">;

interface Props {
  searchParams: Promise<{ session_id?: string; vehicle_id?: string }>;
}

const TIMELINE_STEPS = [
  { icon: CreditCard, label: "Pago confirmado", done: true },
  { icon: Send, label: "Publicación activada", done: true },
  { icon: QrCode, label: "Vinil QR en producción", done: false },
  { icon: Share2, label: "Comparte tu publicación", done: false },
];

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { vehicle_id } = await searchParams;

  if (!vehicle_id) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, brand, model, year, slug, status")
    .eq("id", vehicle_id)
    .eq("user_id", user.id)
    .single();

  const typedVehicle = vehicle as VehicleRow | null;

  if (!typedVehicle) {
    redirect("/dashboard");
  }

  const isStillProcessing = typedVehicle.status === "draft";
  const vehicleTitle = `${typedVehicle.brand} ${typedVehicle.model} ${typedVehicle.year}`;

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        {isStillProcessing ? (
          <>
            {/* Processing state */}
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-yellow-100">
              <Loader2 className="size-10 animate-spin text-yellow-600" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-foreground">
              Procesando tu pago...
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Estamos confirmando tu pago. Esto puede tomar unos segundos.
              La página se actualizará automáticamente.
            </p>
            {/* Auto-refresh after 3 seconds */}
            <meta httpEquiv="refresh" content="3" />
          </>
        ) : (
          <>
            {/* Success state */}
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-accent/15">
              <CheckCircle2 className="size-10 text-accent" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-foreground">
              ¡Pago exitoso!
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tu <strong>{vehicleTitle}</strong> ya está publicado y visible
              para los compradores.
            </p>
          </>
        )}

        {/* Timeline */}
        {!isStillProcessing && (
          <div className="mx-auto mt-8 max-w-xs">
            <div className="space-y-0">
              {TIMELINE_STEPS.map((step, i) => (
                <div key={step.label} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                        step.done
                          ? "bg-accent text-white"
                          : "border-2 border-border bg-white text-muted-foreground"
                      }`}
                    >
                      <step.icon className="size-4" />
                    </div>
                    {i < TIMELINE_STEPS.length - 1 && (
                      <div className={`h-6 w-0.5 ${step.done ? "bg-accent" : "bg-border"}`} />
                    )}
                  </div>
                  <p
                    className={`pt-1 text-sm ${
                      step.done ? "font-medium text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {!isStillProcessing && (
            <Button asChild className="bg-accent text-white hover:bg-accent/90">
              <Link href={`/${typedVehicle.slug}`}>Ver mi publicación</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/dashboard">Ir al Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
