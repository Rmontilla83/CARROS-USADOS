import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod/v4";

const aiPriceResponseSchema = z.object({
  suggested_price: z.number().positive(),
  market_price_low: z.number().positive(),
  market_price_high: z.number().positive(),
  confidence: z.number().min(0).max(1),
  analysis: z.string(),
});

export type AiPriceResponse = z.infer<typeof aiPriceResponseSchema>;

interface PriceAnalysisInput {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  transmission: string;
  fuel: string;
  city?: string;
}

export async function analyzePrice(input: PriceAnalysisInput): Promise<AiPriceResponse> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Eres un experto en el mercado de vehículos usados en Venezuela. Analiza el siguiente vehículo y proporciona una estimación de precio basada en el mercado venezolano actual.

Vehículo:
- Marca: ${input.brand}
- Modelo: ${input.model}
- Año: ${input.year}
- Kilometraje: ${input.mileage.toLocaleString()} km
- Transmisión: ${input.transmission === "automatic" ? "Automática" : input.transmission === "manual" ? "Manual" : "CVT"}
- Combustible: ${input.fuel === "gasoline" ? "Gasolina" : input.fuel === "diesel" ? "Diésel" : input.fuel === "electric" ? "Eléctrico" : input.fuel === "hybrid" ? "Híbrido" : "Gas"}
${input.city ? `- Ciudad: ${input.city}, Venezuela` : "- País: Venezuela"}

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin backticks) con esta estructura exacta:
{
  "suggested_price": <número en USD, precio sugerido>,
  "market_price_low": <número en USD, precio bajo del rango de mercado>,
  "market_price_high": <número en USD, precio alto del rango de mercado>,
  "confidence": <número entre 0 y 1, qué tan seguro estás de la estimación>,
  "analysis": "<texto en español explicando el análisis, máximo 3 oraciones>"
}

Considera factores como: estado general esperado para el año y kilometraje, disponibilidad de repuestos en Venezuela, demanda del modelo en el mercado local, y el tipo de combustible/transmisión. Los precios en Venezuela suelen ser en USD.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Extract JSON from response (handle potential markdown wrapping)
  let jsonStr = text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  const parsed = JSON.parse(jsonStr);
  return aiPriceResponseSchema.parse(parsed);
}
