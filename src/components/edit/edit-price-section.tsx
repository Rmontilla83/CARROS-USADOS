"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Save,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  vehiclePriceSchema,
  type VehiclePriceFormData,
} from "@/lib/validations/vehicle";
import { updateVehicle } from "@/lib/actions/vehicle";

interface AiPriceData {
  suggestedPrice: number;
  marketPriceLow: number;
  marketPriceHigh: number;
  priceMarketAvg: number | null;
}

interface Props {
  vehicleId: string;
  initialPrice: number;
  aiData: AiPriceData | null;
}

export function EditPriceSection({ vehicleId, initialPrice, aiData }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VehiclePriceFormData>({
    resolver: zodResolver(vehiclePriceSchema),
    defaultValues: { price: initialPrice },
  });

  const currentPrice = watch("price");

  const priceStatus = useMemo(() => {
    if (!aiData || !currentPrice || currentPrice <= 0) return null;
    if (currentPrice < aiData.marketPriceLow) return "below_min" as const;
    if (currentPrice > aiData.marketPriceHigh) return "above_max" as const;
    const diff =
      Math.abs(currentPrice - aiData.suggestedPrice) / aiData.suggestedPrice;
    if (diff <= 0.1) return "optimal" as const;
    return "in_range" as const;
  }, [currentPrice, aiData]);

  function getRangePosition(price: number): number {
    if (!aiData) return 50;
    const range = aiData.marketPriceHigh - aiData.marketPriceLow;
    if (range <= 0) return 50;
    return Math.max(
      0,
      Math.min(100, ((price - aiData.marketPriceLow) / range) * 100)
    );
  }

  async function onSubmit(values: VehiclePriceFormData) {
    if (priceStatus === "below_min" || priceStatus === "above_max") return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await updateVehicle({
      vehicleId,
      price: values.price,
    });

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || "Error al guardar");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* AI range display (read-only) */}
      {aiData && (
        <div className="rounded-xl border border-border bg-white p-5">
          <h4 className="text-sm font-bold text-foreground mb-4">
            Rango de mercado (Reporte IA)
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-red-600">
                ${aiData.marketPriceLow.toLocaleString("en-US")}
              </span>
              <span className="text-muted-foreground">
                ${(aiData.priceMarketAvg ?? aiData.suggestedPrice).toLocaleString("en-US")}
              </span>
              <span className="text-red-600">
                ${aiData.marketPriceHigh.toLocaleString("en-US")}
              </span>
            </div>
            <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-400 via-green-400 to-red-400" />
              {/* Suggested marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 size-4 rounded-full border-2 border-white bg-accent shadow-md"
                style={{
                  left: `calc(${getRangePosition(aiData.suggestedPrice)}% - 8px)`,
                }}
                title={`Sugerido: $${aiData.suggestedPrice.toLocaleString("en-US")}`}
              />
              {/* Current price marker */}
              {currentPrice > 0 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 size-4 rounded-full border-2 border-white bg-primary shadow-md"
                  style={{
                    left: `calc(${getRangePosition(currentPrice)}% - 8px)`,
                  }}
                  title={`Tu precio: $${currentPrice.toLocaleString("en-US")}`}
                />
              )}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Mínimo</span>
              <span>Promedio</span>
              <span>Máximo</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="size-2.5 rounded-full bg-accent" />
                <span>Sugerido</span>
              </div>
              {currentPrice > 0 && (
                <div className="flex items-center gap-1">
                  <div className="size-2.5 rounded-full bg-primary" />
                  <span>Tu precio</span>
                </div>
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setValue("price", aiData.suggestedPrice, { shouldValidate: true })
            }
            className="mt-3 gap-1.5 border-accent/30 text-accent hover:bg-accent/10"
          >
            Usar precio sugerido ($
            {aiData.suggestedPrice.toLocaleString("en-US")})
          </Button>
        </div>
      )}

      {/* Price input */}
      <div className="space-y-2">
        <Label htmlFor="edit-price">Precio en USD ($)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="edit-price"
            type="number"
            step="0.01"
            placeholder="Ej: 8500"
            className="pl-7"
            {...register("price", { valueAsNumber: true })}
            onChange={(e) => {
              register("price", { valueAsNumber: true }).onChange(e);
              setSuccess(false);
            }}
            aria-invalid={
              !!errors.price ||
              priceStatus === "below_min" ||
              priceStatus === "above_max"
            }
          />
        </div>
        {errors.price && (
          <p className="text-sm text-destructive">{errors.price.message}</p>
        )}

        {priceStatus === "below_min" && aiData && (
          <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3">
            <XCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
            <p className="text-sm font-medium text-red-800">
              El precio mínimo para este vehículo es $
              {aiData.marketPriceLow.toLocaleString("en-US")}
            </p>
          </div>
        )}
        {priceStatus === "above_max" && aiData && (
          <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3">
            <XCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
            <p className="text-sm font-medium text-red-800">
              El precio máximo para este vehículo es $
              {aiData.marketPriceHigh.toLocaleString("en-US")}
            </p>
          </div>
        )}
        {priceStatus === "optimal" && (
          <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
            <Zap className="size-4 text-accent" />
            <p className="text-sm font-medium text-accent">
              Precio óptimo para venta rápida
            </p>
          </div>
        )}
        {priceStatus === "in_range" && (
          <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 p-3">
            <CheckCircle2 className="size-4 text-green-600" />
            <p className="text-sm font-medium text-green-700">
              Precio dentro del rango de mercado
            </p>
          </div>
        )}
      </div>

      {/* Feedback */}
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
          <CheckCircle2 className="size-4 text-accent" />
          <p className="text-sm font-medium text-accent">Precio actualizado</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={
          saving ||
          priceStatus === "below_min" ||
          priceStatus === "above_max"
        }
        className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {saving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        Guardar precio
      </Button>
    </form>
  );
}
