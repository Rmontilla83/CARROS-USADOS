"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAlert } from "@/lib/actions/alerts";
import {
  VEHICLE_BRANDS,
  ALERT_DURATION_OPTIONS,
} from "@/lib/constants";

const TRANSMISSION_OPTIONS = [
  { value: "", label: "Cualquiera" },
  { value: "automatic", label: "Automática" },
  { value: "manual", label: "Manual" },
  { value: "cvt", label: "CVT" },
];

const FUEL_OPTIONS = [
  { value: "", label: "Cualquiera" },
  { value: "gasoline", label: "Gasolina" },
  { value: "diesel", label: "Diésel" },
  { value: "electric", label: "Eléctrico" },
  { value: "hybrid", label: "Híbrido" },
  { value: "gas", label: "Gas" },
];

export function AlertForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    const data = {
      label: form.get("label") as string,
      brand: (form.get("brand") as string) || undefined,
      model: (form.get("model") as string) || undefined,
      yearMin: form.get("yearMin") ? Number(form.get("yearMin")) : undefined,
      yearMax: form.get("yearMax") ? Number(form.get("yearMax")) : undefined,
      priceMin: form.get("priceMin") ? Number(form.get("priceMin")) : undefined,
      priceMax: form.get("priceMax") ? Number(form.get("priceMax")) : undefined,
      transmission: (form.get("transmission") as "automatic" | "manual" | "cvt") || undefined,
      fuel: (form.get("fuel") as "gasoline" | "diesel" | "electric" | "hybrid" | "gas") || undefined,
      durationDays: (form.get("durationDays") as "30" | "60" | "90") || "30",
    };

    const result = await createAlert(data);
    if (result.success) {
      router.push("/dashboard/alerts");
    } else {
      setError(result.error || "Error al crear la alerta");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="label">Nombre de la alerta *</Label>
        <Input
          id="label"
          name="label"
          required
          placeholder='Ej: "Toyota Corolla económico"'
          className="mt-1.5"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="brand">Marca</Label>
          <select
            id="brand"
            name="brand"
            className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Cualquier marca</option>
            {VEHICLE_BRANDS.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="model">Modelo</Label>
          <Input
            id="model"
            name="model"
            placeholder="Ej: Corolla, Fortuner..."
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="yearMin">Año mínimo</Label>
          <Input
            id="yearMin"
            name="yearMin"
            type="number"
            min={1970}
            max={2027}
            placeholder="Ej: 2015"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="yearMax">Año máximo</Label>
          <Input
            id="yearMax"
            name="yearMax"
            type="number"
            min={1970}
            max={2027}
            placeholder="Ej: 2020"
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="priceMin">Precio mínimo (USD)</Label>
          <Input
            id="priceMin"
            name="priceMin"
            type="number"
            min={0}
            step={100}
            placeholder="Ej: 5000"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="priceMax">Precio máximo (USD)</Label>
          <Input
            id="priceMax"
            name="priceMax"
            type="number"
            min={0}
            step={100}
            placeholder="Ej: 15000"
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="transmission">Transmisión</Label>
          <select
            id="transmission"
            name="transmission"
            className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {TRANSMISSION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="fuel">Combustible</Label>
          <select
            id="fuel"
            name="fuel"
            className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {FUEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="durationDays">Duración de la alerta</Label>
        <select
          id="durationDays"
          name="durationDays"
          className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {ALERT_DURATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value.toString()}>{opt.label}</option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={submitting} className="w-full gap-2">
        <Bell className="size-4" />
        {submitting ? "Creando alerta..." : "Crear alerta"}
      </Button>
    </form>
  );
}
