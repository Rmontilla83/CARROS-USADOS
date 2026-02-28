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
  city?: string;
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
      city: input.city,
    });

    // If vehicleId is provided, save to database
    if (input.vehicleId) {
      const supabase = await createClient();

      await supabase.from("ai_price_reports").insert({
        vehicle_id: input.vehicleId,
        suggested_price: result.suggested_price,
        market_price_low: result.market_price_low,
        market_price_high: result.market_price_high,
        confidence: result.confidence,
        analysis: result.analysis,
      });

      // Update vehicle's suggested_price
      await supabase
        .from("vehicles")
        .update({ suggested_price: result.suggested_price })
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
