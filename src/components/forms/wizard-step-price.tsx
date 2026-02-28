"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TrendingUp, Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  vehiclePriceSchema,
  type VehiclePriceFormData,
} from "@/lib/validations/vehicle";
import { analyzePriceWithAI, type AnalyzePriceResult } from "@/lib/actions/ai";
import type { WizardData } from "@/types/wizard";

interface Props {
  data: WizardData;
  onNext: (values: Partial<WizardData>) => void;
  onBack: () => void;
}

export function WizardStepPrice({ data, onNext, onBack }: Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AnalyzePriceResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
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

  async function handleAnalyze() {
    if (!data.brand || !data.model || !data.year) return;

    setAnalyzing(true);
    setAiResult(null);

    const result = await analyzePriceWithAI({
      brand: data.brand,
      model: data.model,
      year: data.year,
      mileage: data.mileage || 0,
      transmission: data.transmission,
      fuel: data.fuel,
    });

    setAiResult(result);
    setShowAnalysis(true);
    setAnalyzing(false);
  }

  function useSuggestedPrice() {
    if (aiResult?.data?.suggested_price) {
      setValue("price", aiResult.data.suggested_price);
    }
  }

  const canAnalyze = data.brand && data.model && data.year;

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

      {/* AI Analysis section */}
      <div className="rounded-lg border border-border bg-secondary/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Análisis de Mercado IA
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            disabled={analyzing || !canAnalyze}
            className="gap-1.5"
          >
            {analyzing ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <TrendingUp className="size-3.5" />
                Analizar precio
              </>
            )}
          </Button>
        </div>

        {!aiResult && !analyzing && (
          <p className="mt-2 text-sm text-muted-foreground">
            Nuestro sistema de IA analizará el precio de tu vehículo comparándolo
            con el mercado venezolano y te dará una recomendación.
          </p>
        )}

        {aiResult?.success && aiResult.data && (
          <div className="mt-4 space-y-3">
            {/* Suggested price */}
            <div className="rounded-lg bg-white p-4 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Precio sugerido</p>
                  <p className="text-2xl font-extrabold text-accent">
                    ${aiResult.data.suggested_price.toLocaleString("en-US")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={useSuggestedPrice}
                  className="text-xs"
                >
                  Usar este precio
                </Button>
              </div>

              {/* Price range */}
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Rango: ${aiResult.data.market_price_low.toLocaleString("en-US")}</span>
                <div className="h-1 flex-1 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent/60 to-accent"
                    style={{ width: `${Math.round(aiResult.data.confidence * 100)}%` }}
                  />
                </div>
                <span>${aiResult.data.market_price_high.toLocaleString("en-US")}</span>
              </div>

              {/* Confidence */}
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Confianza: {Math.round(aiResult.data.confidence * 100)}%
                </Badge>
              </div>
            </div>

            {/* Analysis text */}
            <button
              type="button"
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Ver análisis detallado</span>
              {showAnalysis ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
            {showAnalysis && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {aiResult.data.analysis}
              </p>
            )}
          </div>
        )}

        {aiResult && !aiResult.success && (
          <div className="mt-3 rounded-lg bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{aiResult.error}</p>
          </div>
        )}
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
