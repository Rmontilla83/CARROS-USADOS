import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod/v4";

export const aiPriceResponseSchema = z.object({
  price_min: z.number().positive(),
  price_max: z.number().positive(),
  price_suggested: z.number().positive(),
  price_market_avg: z.number().positive(),
  confidence: z.number().min(0).max(100),
  factors_up: z.array(z.string()),
  factors_down: z.array(z.string()),
  argument_min: z.string(),
  argument_max: z.string(),
  argument_suggested: z.string(),
  market_summary: z.string(),
  sources: z.array(z.object({
    name: z.string(),
    detail: z.string(),
  })),
});

export type AiPriceResponse = z.infer<typeof aiPriceResponseSchema>;

interface PriceAnalysisInput {
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
}

const TRANSMISSION_LABELS: Record<string, string> = {
  automatic: "Automatica",
  manual: "Manual (sincronico)",
  cvt: "CVT",
};

const FUEL_LABELS: Record<string, string> = {
  gasoline: "Gasolina",
  diesel: "Diesel",
  electric: "Electrico",
  hybrid: "Hibrido",
  gas: "Gas (GNV)",
};

const CONDITION_LABELS: Record<string, string> = {
  papers_ok: "Papeles al dia",
  ac: "Aire acondicionado funcional",
  original_paint: "Pintura original",
  no_accidents: "Sin accidentes",
  single_owner: "Unico dueno",
  service_history: "Historial de mantenimiento",
  spare_tire: "Caucho de repuesto",
  alarm: "Alarma",
  power_windows: "Vidrios electricos",
  power_steering: "Direccion hidraulica",
  abs: "Frenos ABS",
  airbags: "Airbags",
};

export async function analyzePrice(input: PriceAnalysisInput): Promise<AiPriceResponse> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Build conditions description
  const activeConditions: string[] = [];
  const missingConditions: string[] = [];
  if (input.conditions) {
    for (const [key, value] of Object.entries(input.conditions)) {
      const label = CONDITION_LABELS[key] || key;
      if (value) {
        activeConditions.push(label);
      } else {
        missingConditions.push(label);
      }
    }
  }

  const prompt = `Eres un experto tasador de vehiculos usados en Venezuela con 20 anos de experiencia. Tu trabajo es analizar vehiculos y establecer rangos de precios REALISTAS basados en el mercado venezolano actual.

VEHICULO A ANALIZAR:
- Marca: ${input.brand}
- Modelo: ${input.model}
- Ano: ${input.year}
- Kilometraje: ${input.mileage.toLocaleString()} km
- Transmision: ${TRANSMISSION_LABELS[input.transmission] || input.transmission}
- Combustible: ${FUEL_LABELS[input.fuel] || input.fuel}
${input.color ? `- Color: ${input.color}` : ""}
${input.doors ? `- Puertas: ${input.doors}` : ""}
${input.engine ? `- Motor: ${input.engine}` : ""}
${input.city ? `- Ciudad: ${input.city}, Venezuela` : "- Pais: Venezuela"}

CONDICIONES DEL VEHICULO:
${activeConditions.length > 0 ? `SI tiene: ${activeConditions.join(", ")}` : "No se especificaron condiciones positivas"}
${missingConditions.length > 0 ? `NO tiene: ${missingConditions.join(", ")}` : ""}

DESCRIPCION DEL VENDEDOR:
${input.description || "No proporcionada"}

CONTEXTO DEL MERCADO VENEZOLANO que DEBES considerar:
1. Escasez de repuestos: Toyota y Chevrolet tienen mejor disponibilidad. Marcas europeas (BMW, Mercedes) son MUY caros de mantener
2. Marcas mas demandadas: Toyota > Chevrolet > Ford > Hyundai > Kia (en ese orden)
3. Kilometraje: en carros post-2015 se tolera mas km. En carros pre-2010, alto km baja mucho el precio
4. Ciudades: Caracas 10-15% mas caro que provincia. Barcelona/Puerto La Cruz son precios de referencia de provincia
5. Papeles: vehiculo con papeles vencidos pierde 15-25% de valor
6. Combustible: diesel es problematico por escasez. Gas (GNV) tiene mercado limitado
7. Transmision: automatico vale 5-10% mas que sincronico en la mayoria de modelos
8. Los precios en Venezuela son en USD

INSTRUCCIONES ESTRICTAS:
- price_min: precio MINIMO absoluto. Por debajo de esto es sospechoso o irreal
- price_max: precio MAXIMO razonable de mercado. Es una referencia, NO un limite — el vendedor puede poner un precio mayor si lo desea
- price_suggested: precio optimo para vender en ~30 dias
- price_market_avg: promedio real del mercado para este vehiculo
- confidence: 0-100, que tan seguro estas del analisis
- factors_up: MINIMO 2 factores que SUBEN el precio de este vehiculo especifico
- factors_down: MINIMO 2 factores que BAJAN el precio de este vehiculo especifico
- argument_min: explicacion DETALLADA de por que ese es el minimo. Menciona datos concretos: comparaciones con vehiculos similares publicados, depreciacion por ano/km, estado del mercado. Minimo 3-4 oraciones en espanol
- argument_max: explicacion DETALLADA de por que ese es el maximo razonable. Incluye referencias a publicaciones reales de vehiculos similares, que condiciones tendria que tener para alcanzar ese precio. Minimo 3-4 oraciones en espanol
- argument_suggested: por que el precio sugerido es el optimo. Explica el balance entre velocidad de venta y valor justo, comparando con el rango. Minimo 3-4 oraciones en espanol
- market_summary: resumen ejecutivo del mercado para este vehiculo, incluyendo tendencia de precios (subiendo/bajando/estable), oferta vs demanda, y tiempo promedio de venta. Minimo 3-4 oraciones en espanol
- sources: array de fuentes consultadas para el analisis. Cada fuente tiene "name" (nombre de la plataforma o referencia) y "detail" (que datos especificos se usaron de esa fuente). MINIMO 3 fuentes. Ejemplos de fuentes: "TuCarro.com", "MercadoLibre Venezuela", "Marketplace Facebook (grupos de compraventa Anzoategui)", "Historial de depreciacion del modelo", "Indice BCV de inflacion", "Estadisticas de importacion SENIAT". Se especifico en el detalle — menciona rangos de precios encontrados y cantidades de publicaciones

Responde UNICAMENTE con un objeto JSON valido (sin markdown, sin backticks, sin texto adicional):
{
  "price_min": 0,
  "price_max": 0,
  "price_suggested": 0,
  "price_market_avg": 0,
  "confidence": 0,
  "factors_up": [],
  "factors_down": [],
  "argument_min": "",
  "argument_max": "",
  "argument_suggested": "",
  "market_summary": "",
  "sources": [{"name": "", "detail": ""}]
}`;

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
