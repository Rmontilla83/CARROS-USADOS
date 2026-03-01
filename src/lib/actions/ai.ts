"use server";

import { analyzePrice, type AiPriceResponse } from "@/lib/ai/price-analysis";
import { createClient } from "@/lib/supabase/server";

export interface AnalyzePriceInput {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  transmission: string;
  fuel: string;
  color?: string;
  doors?: number;
  engine?: string;
  city?: string;
  conditions?: Record<string, boolean>;
  description?: string;
  vehicleId?: string;
}

export interface AnalyzePriceResult {
  success: boolean;
  data?: AiPriceResponse;
  error?: string;
}

export async function analyzePriceWithAI(
  input: AnalyzePriceInput
): Promise<AnalyzePriceResult> {
  try {
    const result = await analyzePrice({
      brand: input.brand,
      model: input.model,
      year: input.year,
      mileage: input.mileage,
      transmission: input.transmission,
      fuel: input.fuel,
      color: input.color,
      doors: input.doors,
      engine: input.engine,
      city: input.city,
      conditions: input.conditions,
      description: input.description,
    });

    // If vehicleId is provided, save to database
    if (input.vehicleId) {
      const supabase = await createClient();

      await supabase.from("ai_price_reports").insert({
        vehicle_id: input.vehicleId,
        suggested_price: result.price_suggested,
        market_price_low: result.price_min,
        market_price_high: result.price_max,
        price_market_avg: result.price_market_avg,
        confidence: result.confidence,
        analysis: result.market_summary,
        factors_up: result.factors_up,
        factors_down: result.factors_down,
        argument_min: result.argument_min,
        argument_max: result.argument_max,
        argument_suggested: result.argument_suggested,
        market_summary: result.market_summary,
        data_sources: result.sources,
      });

      // Update vehicle's suggested_price
      await supabase
        .from("vehicles")
        .update({ suggested_price: result.price_suggested })
        .eq("id", input.vehicleId);
    }

    return { success: true, data: result };
  } catch (err) {
    console.error("AI price analysis error:", err);
    return {
      success: false,
      error: "No se pudo analizar el precio. Intenta de nuevo.",
    };
  }
}
