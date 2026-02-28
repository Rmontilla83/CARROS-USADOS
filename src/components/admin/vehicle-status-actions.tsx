"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateVehicleStatus } from "@/lib/actions/admin";
import type { VehicleStatus } from "@/types";

interface Props {
  vehicleId: string;
  currentStatus: VehicleStatus;
}

export function VehicleStatusActions({ vehicleId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(status: VehicleStatus) {
    setLoading(status);
    const result = await updateVehicleStatus(vehicleId, status);
    if (result.success) {
      router.refresh();
    }
    setLoading(null);
  }

  if (currentStatus === "pending_review") {
    return (
      <div className="flex items-center gap-1">
        <Button
          onClick={() => handleAction("active")}
          disabled={loading !== null}
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-accent hover:bg-accent/10 hover:text-accent"
        >
          {loading === "active" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          <span className="hidden sm:inline">Aprobar</span>
        </Button>
        <Button
          onClick={() => handleAction("rejected")}
          disabled={loading !== null}
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {loading === "rejected" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <X className="size-3.5" />
          )}
          <span className="hidden sm:inline">Rechazar</span>
        </Button>
      </div>
    );
  }

  if (currentStatus === "active") {
    return (
      <Button
        onClick={() => handleAction("rejected")}
        disabled={loading !== null}
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        {loading === "rejected" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <X className="size-3.5" />
        )}
        <span className="hidden sm:inline">Rechazar</span>
      </Button>
    );
  }

  if (currentStatus === "rejected") {
    return (
      <Button
        onClick={() => handleAction("active")}
        disabled={loading !== null}
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-accent hover:bg-accent/10 hover:text-accent"
      >
        {loading === "active" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Check className="size-3.5" />
        )}
        <span className="hidden sm:inline">Aprobar</span>
      </Button>
    );
  }

  return <span className="text-xs text-muted-foreground">—</span>;
}
