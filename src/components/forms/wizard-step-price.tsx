"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  vehiclePriceSchema,
  type VehiclePriceFormData,
} from "@/lib/validations/vehicle";
import type { WizardData } from "@/types/wizard";

interface Props {
  data: WizardData;
  onNext: (values: Partial<WizardData>) => void;
  onBack: () => void;
}

export function WizardStepPrice({ data, onNext, onBack }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehiclePriceFormData>({
    resolver: zodResolver(vehiclePriceSchema),
    defaultValues: {
      price: data.price || undefined,
    },
  });

  function onSubmit(values: VehiclePriceFormData) {
    onNext({ price: values.price });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Precio</h2>

      <div className="space-y-2">
        <Label htmlFor="price">Precio en USD ($)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="price"
            type="number"
            step="0.01"
            placeholder="Ej: 8500"
            className="pl-7"
            {...register("price", { valueAsNumber: true })}
            aria-invalid={!!errors.price}
          />
        </div>
        {errors.price && (
          <p className="text-sm text-destructive">{errors.price.message}</p>
        )}
      </div>

      {/* AI recommendation placeholder */}
      <div className="rounded-lg border border-border bg-secondary/50 p-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Análisis de Mercado IA
          </span>
          <Badge variant="secondary" className="text-xs">
            Próximamente
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Nuestro sistema de IA analizará el precio de tu vehículo comparándolo
          con el mercado local y te dará una recomendación. Esta funcionalidad
          estará disponible pronto.
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button
          type="submit"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          size="lg"
        >
          Siguiente
        </Button>
      </div>
    </form>
  );
}
