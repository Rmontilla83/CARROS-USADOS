"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function VehicleCardError({ error, reset }: Props) {
  useEffect(() => {
    console.error("Vehicle card error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <AlertTriangle className="size-12 text-destructive/50" />
      <h2 className="mt-4 text-xl font-bold text-foreground">
        Error al cargar el vehículo
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        No pudimos cargar la información de este vehículo.
      </p>
      <div className="mt-4 flex gap-3">
        <Button
          onClick={reset}
          className="bg-primary text-primary-foreground"
        >
          Reintentar
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Ir al inicio</Link>
        </Button>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">{APP_NAME}</p>
    </div>
  );
}
