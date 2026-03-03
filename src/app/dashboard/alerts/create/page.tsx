import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AlertForm } from "@/components/dashboard/alert-form";

export const metadata: Metadata = {
  title: "Crear Alerta — Dashboard",
};

export default function CreateAlertPage() {
  return (
    <div>
      <Link
        href="/dashboard/alerts"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a mis alertas
      </Link>

      <h1 className="text-2xl font-bold text-foreground">Crear alerta</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Define los criterios del vehículo que buscas. Te notificaremos por email cuando se publique uno que coincida.
      </p>

      <div className="mt-6 max-w-xl rounded-xl border border-border bg-white p-6 shadow-sm">
        <AlertForm />
      </div>
    </div>
  );
}
