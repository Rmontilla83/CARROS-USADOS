"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { VEHICLE_CONDITIONS } from "@/lib/constants";
import type { WizardData } from "@/types/wizard";

interface Props {
  data: WizardData;
  onNext: (values: Partial<WizardData>) => void;
  onBack: () => void;
}

export function WizardStepDescription({ data, onNext, onBack }: Props) {
  const [description, setDescription] = useState(data.description);
  const [conditions, setConditions] = useState<Record<string, boolean>>(
    data.conditions
  );

  function toggleCondition(key: string) {
    setConditions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleNext() {
    onNext({ description, conditions });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        Descripción y Condiciones
      </h2>

      {/* Free text description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Descripción{" "}
          <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Describe tu vehículo: estado general, accesorios, razón de venta, historia de mantenimiento..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground text-right">
          {description.length}/2000
        </p>
      </div>

      {/* Conditions checklist */}
      <div className="space-y-3">
        <Label>Condiciones del vehículo</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {VEHICLE_CONDITIONS.map((condition) => (
            <label
              key={condition.key}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50"
            >
              <Checkbox
                checked={!!conditions[condition.key]}
                onCheckedChange={() => toggleCondition(condition.key)}
              />
              <span className="text-sm text-foreground">
                {condition.label}
              </span>
            </label>
          ))}
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
