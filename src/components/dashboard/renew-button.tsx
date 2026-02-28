"use client";

import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { renewVehicle } from "@/lib/actions/vehicle";

interface Props {
  vehicleId: string;
}

export function RenewButton({ vehicleId }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  async function handleRenew() {
    setLoading(true);
    setResult(null);
    const res = await renewVehicle(vehicleId);
    setResult(res);
    setLoading(false);
  }

  if (result?.success) {
    return (
      <div className="rounded-lg border border-accent/30 bg-accent/10 p-3">
        <p className="text-sm font-medium text-accent">
          Publicación renovada por 60 días
        </p>
      </div>
    );
  }

  return (
    <div>
      <Button
        onClick={handleRenew}
        disabled={loading}
        className="gap-2 bg-accent text-white hover:bg-accent/90"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RefreshCw className="size-4" />
        )}
        Renovar publicación
      </Button>
      {result?.error && (
        <p className="mt-2 text-sm text-destructive">{result.error}</p>
      )}
    </div>
  );
}
