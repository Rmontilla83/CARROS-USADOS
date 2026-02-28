"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Zap,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  vehiclePriceSchema,
  type VehiclePriceFormData,
} from "@/lib/validations/vehicle";
import { analyzePriceWithAI, type AnalyzePriceResult } from "@/lib/actions/ai";
import type { AiPriceResponse } from "@/lib/ai/price-analysis";
import type { WizardData } from "@/types/wizard";

interface Props {
  data: WizardData;
  onNext: (values: Partial<WizardData>) => void;
  onBack: () => void;
}

export function WizardStepPrice({ data, onNext, onBack }: Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AiPriceResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const hasTriggered = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VehiclePriceFormData>({
    resolver: zodResolver(vehiclePriceSchema),
    defaultValues: {
      price: data.price || undefined,
    },
  });

  const currentPrice = watch("price");

  // Price validation against AI limits
  const priceStatus = useMemo(() => {
    if (!aiResult || !currentPrice || currentPrice <= 0) return null;
    if (currentPrice < aiResult.price_min) return "below_min" as const;
    if (currentPrice > aiResult.price_max) return "above_max" as const;
    const diff = Math.abs(currentPrice - aiResult.price_suggested) / aiResult.price_suggested;
    if (diff <= 0.1) return "optimal" as const;
    return "in_range" as const;
  }, [currentPrice, aiResult]);

  const canSubmit = !!aiResult && !!priceStatus && priceStatus !== "below_min" && priceStatus !== "above_max";

  function onSubmit(values: VehiclePriceFormData) {
    if (!canSubmit) return;
    onNext({ price: values.price });
  }

  async function handleAnalyze() {
    if (!data.brand || !data.model || !data.year) return;
    setAnalyzing(true);
    setAiError(null);
    setAiResult(null);

    const result: AnalyzePriceResult = await analyzePriceWithAI({
      brand: data.brand,
      model: data.model,
      year: data.year,
      mileage: data.mileage || 0,
      transmission: data.transmission,
      fuel: data.fuel,
      color: data.color,
      doors: data.doors,
      engine: data.engine,
      conditions: data.conditions,
      description: data.description,
    });

    if (result.success && result.data) {
      setAiResult(result.data);
      setShowDetails(true);
    } else {
      setAiError(result.error || "Error desconocido");
    }
    setAnalyzing(false);
  }

  // Auto-trigger AI analysis on mount
  useEffect(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;
    handleAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useSuggestedPrice() {
    if (aiResult?.price_suggested) {
      setValue("price", aiResult.price_suggested, { shouldValidate: true });
    }
  }

  // Range bar position calculation
  function getRangePosition(price: number): number {
    if (!aiResult) return 50;
    const range = aiResult.price_max - aiResult.price_min;
    if (range <= 0) return 50;
    return Math.max(0, Math.min(100, ((price - aiResult.price_min) / range) * 100));
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-lg font-semibold text-foreground">Precio</h2>

      {/* Loading state */}
      {analyzing && (
        <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="size-8 text-accent animate-spin" />
            <div>
              <p className="text-sm font-bold text-foreground">
                Analizando el mercado...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Nuestra IA esta evaluando precios en el mercado venezolano
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error state with retry */}
      {!analyzing && aiError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <XCircle className="size-6 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">{aiError}</p>
            </div>
            <Button
              type="button"
              onClick={handleAnalyze}
              variant="outline"
              size="sm"
              className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <RefreshCw className="size-4" />
              Reintentar
            </Button>
          </div>
        </div>
      )}

      {/* AI Result display */}
      {aiResult && (
        <div className="space-y-4">
          {/* Suggested price card */}
          <div className="rounded-xl border border-accent/30 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="size-5 text-accent" />
                <span className="text-sm font-bold text-foreground">Precio sugerido</span>
              </div>
              <Badge className="bg-accent/15 text-accent border-accent/30 text-xs">
                Confianza: {aiResult.confidence}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-black text-accent">
                ${aiResult.price_suggested.toLocaleString("en-US")}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={useSuggestedPrice}
                className="gap-1.5 border-accent/30 text-accent hover:bg-accent/10"
              >
                Usar este precio
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {aiResult.argument_suggested}
            </p>
          </div>

          {/* Visual range bar */}
          <div className="rounded-xl border border-border bg-white p-5">
            <h4 className="text-sm font-bold text-foreground mb-4">Rango de mercado</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-red-600">${aiResult.price_min.toLocaleString("en-US")}</span>
                <span className="text-muted-foreground">${aiResult.price_market_avg.toLocaleString("en-US")}</span>
                <span className="text-red-600">${aiResult.price_max.toLocaleString("en-US")}</span>
              </div>
              <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden">
                {/* Gradient bar */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-400 via-green-400 to-red-400" />
                {/* Suggested marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 size-4 rounded-full border-2 border-white bg-accent shadow-md"
                  style={{ left: `calc(${getRangePosition(aiResult.price_suggested)}% - 8px)` }}
                  title={`Sugerido: $${aiResult.price_suggested.toLocaleString("en-US")}`}
                />
                {/* Current price marker */}
                {currentPrice && currentPrice > 0 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 size-4 rounded-full border-2 border-white bg-primary shadow-md"
                    style={{ left: `calc(${getRangePosition(currentPrice)}% - 8px)` }}
                    title={`Tu precio: $${currentPrice.toLocaleString("en-US")}`}
                  />
                )}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Minimo</span>
                <span>Promedio</span>
                <span>Maximo</span>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="size-2.5 rounded-full bg-accent" />
                  <span>Sugerido</span>
                </div>
                {currentPrice && currentPrice > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="size-2.5 rounded-full bg-primary" />
                    <span>Tu precio</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Factors */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Factors UP */}
            <div className="rounded-xl border border-green-200 bg-green-50/50 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="size-4 text-green-600" />
                <span className="text-xs font-bold text-green-800">Sube el precio</span>
              </div>
              <ul className="space-y-1">
                {aiResult.factors_up.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-sm text-green-700">
                    <span className="mt-0.5 text-green-500">+</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            {/* Factors DOWN */}
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown className="size-4 text-red-600" />
                <span className="text-xs font-bold text-red-800">Baja el precio</span>
              </div>
              <ul className="space-y-1">
                {aiResult.factors_down.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-sm text-red-700">
                    <span className="mt-0.5 text-red-500">-</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Expandable details */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex w-full items-center justify-between rounded-lg p-2 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
          >
            <span>Argumentos detallados y resumen de mercado</span>
            {showDetails ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
          {showDetails && (
            <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
              <div>
                <p className="text-xs font-bold text-foreground mb-1">Precio minimo — ${aiResult.price_min.toLocaleString("en-US")}</p>
                <p className="text-sm text-muted-foreground">{aiResult.argument_min}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-foreground mb-1">Precio maximo — ${aiResult.price_max.toLocaleString("en-US")}</p>
                <p className="text-sm text-muted-foreground">{aiResult.argument_max}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-foreground mb-1">Resumen del mercado</p>
                <p className="text-sm text-muted-foreground">{aiResult.market_summary}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Price input */}
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
            disabled={analyzing}
            {...register("price", { valueAsNumber: true })}
            aria-invalid={!!errors.price || priceStatus === "below_min" || priceStatus === "above_max"}
          />
        </div>
        {errors.price && (
          <p className="text-sm text-destructive">{errors.price.message}</p>
        )}

        {/* Price validation feedback */}
        {priceStatus === "below_min" && aiResult && (
          <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3">
            <XCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                El precio minimo para este vehiculo es ${aiResult.price_min.toLocaleString("en-US")}
              </p>
              <p className="text-xs text-red-600 mt-1">{aiResult.argument_min}</p>
            </div>
          </div>
        )}
        {priceStatus === "above_max" && aiResult && (
          <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3">
            <XCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                El precio maximo para este vehiculo es ${aiResult.price_max.toLocaleString("en-US")}
              </p>
              <p className="text-xs text-red-600 mt-1">{aiResult.argument_max}</p>
            </div>
          </div>
        )}
        {priceStatus === "optimal" && (
          <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
            <Zap className="size-4 text-accent" />
            <p className="text-sm font-medium text-accent">Precio optimo para venta rapida</p>
          </div>
        )}
        {priceStatus === "in_range" && (
          <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 p-3">
            <CheckCircle2 className="size-4 text-green-600" />
            <p className="text-sm font-medium text-green-700">Precio dentro del rango de mercado</p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Atras
        </Button>
        <Button
          type="submit"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          size="lg"
          disabled={!canSubmit || analyzing}
        >
          Siguiente
        </Button>
      </div>
    </form>
  );
}
