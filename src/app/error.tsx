"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-secondary to-white px-4">
      <div className="rounded-2xl bg-destructive/10 p-4">
        <AlertTriangle className="size-12 text-destructive" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-foreground">
        Algo salió mal
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ocurrió un error inesperado. Por favor intenta de nuevo.
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
      >
        Reintentar
      </button>
    </div>
  );
}
