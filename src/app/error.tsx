"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <AlertTriangle className="size-16 text-destructive/50" />
      <h1 className="mt-6 text-2xl font-bold text-foreground">
        Algo salió mal
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ocurrió un error inesperado. Por favor intenta de nuevo.
      </p>
      <Button
        onClick={reset}
        className="mt-6 bg-primary text-primary-foreground"
      >
        Reintentar
      </Button>
    </div>
  );
}
