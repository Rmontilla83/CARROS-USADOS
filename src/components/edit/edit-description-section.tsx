"use client";

import { useState } from "react";
import { Loader2, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { VEHICLE_CONDITIONS } from "@/lib/constants";
import { updateVehicle } from "@/lib/actions/vehicle";

interface Props {
  vehicleId: string;
  initialDescription: string;
  initialConditions: Record<string, boolean>;
}

export function EditDescriptionSection({
  vehicleId,
  initialDescription,
  initialConditions,
}: Props) {
  const [description, setDescription] = useState(initialDescription);
  const [conditions, setConditions] = useState<Record<string, boolean>>(
    initialConditions
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function toggleCondition(key: string) {
    setConditions((prev) => ({ ...prev, [key]: !prev[key] }));
    setSuccess(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await updateVehicle({
      vehicleId,
      description,
      conditions,
    });

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || "Error al guardar");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="edit-description">
          Descripción{" "}
          <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="edit-description"
          placeholder="Describe tu vehículo: estado general, accesorios, razón de venta..."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setSuccess(false);
          }}
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

      {/* Feedback + Save */}
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
          <CheckCircle2 className="size-4 text-accent" />
          <p className="text-sm font-medium text-accent">Descripción actualizada</p>
        </div>
      )}

      <Button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {saving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        Guardar descripción
      </Button>
    </div>
  );
}
