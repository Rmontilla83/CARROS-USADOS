"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, Truck, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateQrOrderStatus, assignCourier } from "@/lib/actions/admin";
import type { QrOrderStatus, Profile } from "@/types";

interface Props {
  orderId: string;
  currentStatus: QrOrderStatus;
  couriers: Pick<Profile, "id" | "full_name">[];
}

export function QrOrderActions({ orderId, currentStatus, couriers }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCourierSelect, setShowCourierSelect] = useState(false);

  async function handleStatusUpdate(status: QrOrderStatus) {
    setLoading(true);
    const result = await updateQrOrderStatus(orderId, status);
    if (result.success) {
      router.refresh();
    }
    setLoading(false);
  }

  async function handleAssignCourier(courierId: string) {
    setLoading(true);
    const result = await assignCourier(orderId, courierId);
    if (result.success) {
      setShowCourierSelect(false);
      router.refresh();
    }
    setLoading(false);
  }

  if (currentStatus === "pending") {
    return (
      <Button
        onClick={() => handleStatusUpdate("printed")}
        disabled={loading}
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-primary hover:bg-primary/10"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Printer className="size-3.5" />
        )}
        Marcar impreso
      </Button>
    );
  }

  if (currentStatus === "printed") {
    if (showCourierSelect) {
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {couriers.length > 0 ? (
            couriers.map((c) => (
              <Button
                key={c.id}
                onClick={() => handleAssignCourier(c.id)}
                disabled={loading}
                size="sm"
                variant="outline"
                className="h-7 text-xs"
              >
                {loading ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Truck className="size-3" />
                )}
                {c.full_name}
              </Button>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">
              No hay motorizados registrados
            </p>
          )}
          <Button
            onClick={() => setShowCourierSelect(false)}
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
          >
            Cancelar
          </Button>
        </div>
      );
    }

    return (
      <Button
        onClick={() => setShowCourierSelect(true)}
        disabled={loading}
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-orange-600 hover:bg-orange-100"
      >
        <Truck className="size-3.5" />
        Asignar motorizado
      </Button>
    );
  }

  if (currentStatus === "assigned") {
    return (
      <Button
        onClick={() => handleStatusUpdate("delivered")}
        disabled={loading}
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-accent hover:bg-accent/10"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Check className="size-3.5" />
        )}
        Marcar entregado
      </Button>
    );
  }

  if (currentStatus === "delivered") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-accent">
        <Check className="size-3" />
        Entregado
      </span>
    );
  }

  return <span className="text-xs text-muted-foreground">—</span>;
}
