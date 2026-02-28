"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markVehicleAsSold } from "@/lib/actions/vehicle";

interface Props {
  vehicleId: string;
}

export function MarkAsSoldButton({ vehicleId }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    const result = await markVehicleAsSold(vehicleId);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || "Error desconocido");
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={handleConfirm}
          disabled={loading}
          size="sm"
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="size-3.5" />
          )}
          {loading ? "Procesando..." : "Confirmar"}
        </Button>
        <Button
          onClick={() => setConfirming(false)}
          disabled={loading}
          size="sm"
          variant="ghost"
        >
          Cancelar
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <Button
      onClick={() => setConfirming(true)}
      size="sm"
      variant="outline"
      className="border-blue-300 text-blue-700 hover:bg-blue-50"
    >
      <CheckCircle2 className="size-3.5" />
      Marcar como Vendido
    </Button>
  );
}
