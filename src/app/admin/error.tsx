"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: Props) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <AlertTriangle className="size-12 text-destructive/50" />
      <h2 className="mt-4 text-xl font-bold text-foreground">
        Error en el panel admin
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Ocurrió un error al cargar esta página.
      </p>
      <Button
        onClick={reset}
        className="mt-4 bg-primary text-primary-foreground"
      >
        Reintentar
      </Button>
    </div>
  );
}
