"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAIN_CITIES } from "@/lib/constants";
import type { WizardData, DeliveryData } from "@/types/wizard";

interface Props {
  data: WizardData;
  onNext: (values: Partial<WizardData>) => void;
  onBack: () => void;
}

const TIME_OPTIONS = [
  { value: "morning", label: "Mañana (8am - 12pm)" },
  { value: "afternoon", label: "Tarde (12pm - 6pm)" },
  { value: "any", label: "Cualquier hora" },
] as const;

export function WizardStepDelivery({ data, onNext, onBack }: Props) {
  const [delivery, setDelivery] = useState<DeliveryData>(data.delivery);
  const [errors, setErrors] = useState<Partial<Record<keyof DeliveryData, string>>>({});

  function update(field: keyof DeliveryData, value: string) {
    setDelivery((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleNext() {
    const newErrors: Partial<Record<keyof DeliveryData, string>> = {};

    if (!delivery.address.trim()) {
      newErrors.address = "Ingresa la dirección de entrega";
    }
    if (!delivery.city.trim()) {
      newErrors.city = "Selecciona la ciudad";
    }
    if (!delivery.phone.trim()) {
      newErrors.phone = "Ingresa un teléfono de contacto";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext({ delivery });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        Entrega del QR
      </h2>
      <p className="text-sm text-muted-foreground">
        Indícanos dónde entregaremos tu vinil QR. Un motorizado lo llevará a la
        dirección que indiques.
      </p>

      <div className="space-y-4">
        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="delivery-address">Dirección de entrega</Label>
          <Textarea
            id="delivery-address"
            placeholder="Ej: Av. Principal de Lechería, Edificio Mar Azul, Piso 3, Apto 3B"
            value={delivery.address}
            onChange={(e) => update("address", e.target.value)}
            rows={2}
            maxLength={500}
          />
          {errors.address && (
            <p className="text-xs text-destructive">{errors.address}</p>
          )}
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="delivery-city">Ciudad</Label>
          <select
            id="delivery-city"
            value={delivery.city}
            onChange={(e) => update("city", e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Selecciona una ciudad</option>
            {MAIN_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          {errors.city && (
            <p className="text-xs text-destructive">{errors.city}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="delivery-phone">Teléfono de contacto para el motorizado</Label>
          <Input
            id="delivery-phone"
            type="tel"
            placeholder="+58 412 1234567"
            value={delivery.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone}</p>
          )}
        </div>

        {/* Preferred time */}
        <div className="space-y-2">
          <Label>Horario preferido de entrega</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {TIME_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center justify-center rounded-lg border p-3 text-sm transition-colors ${
                  delivery.preferredTime === option.value
                    ? "border-primary bg-primary/5 font-medium text-primary"
                    : "border-border text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                <input
                  type="radio"
                  name="preferredTime"
                  value={option.value}
                  checked={delivery.preferredTime === option.value}
                  onChange={(e) => update("preferredTime", e.target.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="delivery-notes">
            Notas adicionales{" "}
            <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Textarea
            id="delivery-notes"
            placeholder="Punto de referencia, instrucciones especiales para el motorizado..."
            value={delivery.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={2}
            maxLength={500}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          size="lg"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
