"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createAlert } from "@/lib/actions/alerts";
import { ALERT_DURATION_OPTIONS } from "@/lib/constants";

export interface CatalogFiltersData {
  brand: string;
  city: string;
  yearMin: string;
  yearMax: string;
  priceMin: string;
  priceMax: string;
  transmission: string;
  fuel: string;
  q: string;
}

interface SaveSearchAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: CatalogFiltersData;
}

const FILTER_LABELS: Record<string, string> = {
  brand: "Marca",
  city: "Ciudad",
  yearMin: "Año desde",
  yearMax: "Año hasta",
  priceMin: "Precio mín",
  priceMax: "Precio máx",
  transmission: "Transmisión",
  fuel: "Combustible",
  q: "Búsqueda",
};

const TRANSMISSION_LABELS: Record<string, string> = {
  automatic: "Automática",
  manual: "Manual",
  cvt: "CVT",
};

const FUEL_LABELS: Record<string, string> = {
  gasoline: "Gasolina",
  diesel: "Diésel",
  electric: "Eléctrico",
  hybrid: "Híbrido",
  gas: "Gas",
};

function formatFilterValue(key: string, value: string): string {
  if (key === "transmission") return TRANSMISSION_LABELS[value] || value;
  if (key === "fuel") return FUEL_LABELS[value] || value;
  if (key === "priceMin" || key === "priceMax") return `$${Number(value).toLocaleString()}`;
  return value;
}

export function SaveSearchAlert({ open, onOpenChange, filters }: SaveSearchAlertProps) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [duration, setDuration] = useState<string>("30");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const activeFilters = Object.entries(filters).filter(
    ([, value]) => value !== ""
  );

  async function handleSave() {
    if (!label.trim()) {
      setError("Dale un nombre a tu alerta");
      return;
    }

    setLoading(true);
    setError("");

    const result = await createAlert({
      label: label.trim(),
      brand: filters.brand || undefined,
      model: undefined,
      yearMin: filters.yearMin ? Number(filters.yearMin) : undefined,
      yearMax: filters.yearMax ? Number(filters.yearMax) : undefined,
      priceMin: filters.priceMin ? Number(filters.priceMin) : undefined,
      priceMax: filters.priceMax ? Number(filters.priceMax) : undefined,
      transmission: (filters.transmission as "automatic" | "manual" | "cvt") || undefined,
      fuel: (filters.fuel as "gasoline" | "diesel" | "electric" | "hybrid" | "gas") || undefined,
      city: filters.city || undefined,
      durationDays: duration as "30" | "60" | "90",
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error || "Error al crear la alerta");
      return;
    }

    setSuccess(true);
  }

  function handleClose() {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setLabel("");
      setDuration("30");
      setError("");
      setSuccess(false);
    }, 200);
  }

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="size-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Alerta creada
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Te notificaremos por email cuando aparezca un vehículo que
                coincida con tu búsqueda.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cerrar
              </Button>
              <Button
                onClick={() => router.push("/dashboard/alerts")}
                className="bg-accent text-white hover:bg-accent/90"
              >
                Ver Mis Alertas
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="size-5 text-accent" />
            Guardar búsqueda como alerta
          </DialogTitle>
          <DialogDescription>
            Recibirás un email cuando se publique un vehículo que coincida con
            estos criterios.
          </DialogDescription>
        </DialogHeader>

        {/* Active filter summary */}
        {activeFilters.length > 0 && (
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Criterios de búsqueda
            </p>
            <div className="flex flex-wrap gap-1.5">
              {activeFilters.map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-medium text-foreground ring-1 ring-inset ring-border"
                >
                  {FILTER_LABELS[key]}: {formatFilterValue(key, value)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Alert name */}
        <div className="space-y-1.5">
          <Label htmlFor="alert-label">Nombre de la alerta *</Label>
          <Input
            id="alert-label"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              setError("");
            }}
            placeholder="Ej: Toyota automático económico"
            maxLength={100}
          />
        </div>

        {/* Duration */}
        <div className="space-y-1.5">
          <Label>Duración</Label>
          <div className="grid grid-cols-3 gap-2">
            {ALERT_DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDuration(String(opt.value))}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  duration === String(opt.value)
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-white text-muted-foreground hover:border-accent/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-accent text-white hover:bg-accent/90"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Bell className="size-4" />
                Crear alerta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
