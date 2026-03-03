"use client";

import { useState } from "react";
import { Bell, Pause, Play, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { pauseAlert, resumeAlert, deleteAlert } from "@/lib/actions/alerts";
import type { SearchAlert } from "@/types";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: "Activa", className: "bg-green-100 text-green-700 border-green-200" },
  paused: { label: "Pausada", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  expired: { label: "Expirada", className: "bg-gray-100 text-gray-500 border-gray-200" },
};

interface AlertListProps {
  alerts: SearchAlert[];
}

export function AlertList({ alerts: initialAlerts }: AlertListProps) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [loading, setLoading] = useState<string | null>(null);

  async function handlePause(alertId: string) {
    setLoading(alertId);
    const result = await pauseAlert(alertId);
    if (result.success) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: "paused" as const } : a))
      );
    }
    setLoading(null);
  }

  async function handleResume(alertId: string) {
    setLoading(alertId);
    const result = await resumeAlert(alertId);
    if (result.success) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: "active" as const } : a))
      );
    }
    setLoading(null);
  }

  async function handleDelete(alertId: string) {
    setLoading(alertId);
    const result = await deleteAlert(alertId);
    if (result.success) {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    }
    setLoading(null);
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
        <Bell className="mx-auto size-12 text-muted-foreground/20" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          No tienes alertas
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Crea una alerta para recibir notificaciones cuando se publique un vehículo que coincida con tu búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => {
        const status = STATUS_CONFIG[alert.status] || STATUS_CONFIG.active;
        const isExpired = alert.status === "expired";
        const daysLeft = Math.max(
          0,
          Math.ceil((new Date(alert.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        );
        const isLoading = loading === alert.id;

        // Build criteria display
        const criteria: string[] = [];
        if (alert.brand) criteria.push(alert.brand);
        if (alert.model) criteria.push(alert.model);
        if (alert.year_min || alert.year_max) {
          criteria.push(`${alert.year_min ?? "..."}-${alert.year_max ?? "..."}`);
        }
        if (alert.price_min != null || alert.price_max != null) {
          criteria.push(
            `$${alert.price_min?.toLocaleString() ?? "0"} - $${alert.price_max?.toLocaleString() ?? "..."}`
          );
        }
        if (alert.transmission) criteria.push(alert.transmission);
        if (alert.fuel) criteria.push(alert.fuel);

        return (
          <div
            key={alert.id}
            className={`rounded-xl border bg-white p-5 shadow-sm transition-opacity ${
              isExpired ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-bold text-foreground">
                    {alert.label}
                  </h3>
                  <Badge className={`border text-[10px] ${status.className}`}>
                    {status.label}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {criteria.join(" · ") || "Todos los vehículos"}
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Bell className="size-3" />
                    {alert.notification_count} notificación{alert.notification_count !== 1 ? "es" : ""}
                  </span>
                  {!isExpired && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {daysLeft} día{daysLeft !== 1 ? "s" : ""} restante{daysLeft !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {!isExpired && (
                <div className="flex items-center gap-1">
                  {alert.status === "active" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePause(alert.id)}
                      disabled={isLoading}
                      title="Pausar"
                    >
                      <Pause className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleResume(alert.id)}
                      disabled={isLoading}
                      title="Reactivar"
                    >
                      <Play className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(alert.id)}
                    disabled={isLoading}
                    className="text-destructive hover:text-destructive"
                    title="Eliminar"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
