"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export function SuccessMessage() {
  const searchParams = useSearchParams();
  const published = searchParams.get("published");

  if (published !== "true") return null;

  return (
    <div className="mt-4 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 p-4">
      <CheckCircle2 className="size-5 text-accent" />
      <p className="text-sm font-medium text-foreground">
        ¡Vehículo publicado exitosamente! Tu vinil QR estará listo pronto.
      </p>
    </div>
  );
}
