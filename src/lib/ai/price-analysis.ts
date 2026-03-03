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
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [{ googleSearch: {} } as never],
  });

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

  const today = new Date().toISOString().split("T")[0];

  const searchQuery = `${input.brand} ${input.model} ${input.year}`;
  const searchQueryVariants = [
    `"${input.brand} ${input.model}" ${input.year} venta Venezuela dolares`,
    `"${input.brand} ${input.model}" ${input.year} precio Venezuela USD`,
    `"${input.brand} ${input.model}" ${input.year} dueno vende Venezuela`,
  ];

  const prompt = `Eres un analista de mercado automotriz especializado EXCLUSIVAMENTE en Venezuela. Tu mision es darle al COMPRADOR un analisis justo y realista para que pueda negociar con datos solidos. Fecha de hoy: ${today}.

=== FASE 1: INVESTIGACION DE MERCADO (OBLIGATORIA) ===

DEBES realizar MULTIPLES busquedas antes de responder. Busca TODAS estas variantes:

BUSQUEDAS PRINCIPALES (portales de venta):
1. Busca: "${searchQuery} venta Venezuela" en tucarro.com.ve
2. Busca: "${searchQuery} precio Venezuela" en mercadolibre.com.ve
3. Busca: "${searchQuery}" en lapatilla.com/clasificados o tucarrovenezuela.com

BUSQUEDAS DE PRECIO REAL (para filtrar inflacion de revendedores):
4. Busca: ${searchQueryVariants[0]}
5. Busca: ${searchQueryVariants[1]}
6. Busca: ${searchQueryVariants[2]}

BUSQUEDAS DE CONTEXTO Y DEPRECIACION:
7. Busca: "${input.brand} ${input.model} depreciacion Venezuela" o "guia precios carros usados Venezuela ${input.year}"
8. Busca: "precio real ${input.brand} ${input.model} Venezuela" en foros, blogs o articulos recientes

IMPORTANTE: Haz TODAS las busquedas posibles. Mientras mas datos reales tengas, mejor sera tu analisis.

=== FASE 2: FILTRADO DE PRECIOS INFLADOS ===

REGLA CRITICA: En Venezuela los revendedores/agencias inflan precios entre 15-35% respecto al valor real de mercado. DEBES aplicar este filtro:

COMO IDENTIFICAR PRECIOS INFLADOS:
- Publicaciones de "agencias", "multimarca", "automax", "motors", "car center" → probablemente inflado 20-35%
- Misma agencia publicando muchos vehiculos diferentes → revendedor, precio inflado
- Precios round numbers perfectos (ej: exactamente $10,000) en portales → posible revendedor
- Publicaciones con fotos muy profesionales/estudio → posible agencia

COMO IDENTIFICAR PRECIOS REALES:
- Publicaciones de duenos directos (palabras clave: "dueno", "particular", "unico dueno", "vendo mi", "por viaje", "por motivo")
- Publicaciones en grupos de Facebook con descripcion personal
- Precios con numeros no redondos (ej: $7,800 en vez de $8,000)
- Publicaciones con fotos casuales/en casa

METODOLOGIA DE PRECIO JUSTO:
1. Recopila TODOS los precios que encuentres
2. Identifica cuales son de revendedor y cuales de dueno directo
3. A los precios de revendedor, aplica descuento de 20-30% para estimar valor real
4. Los precios de dueno directo son tu mejor referencia
5. El precio JUSTO esta entre el precio mas bajo de dueno directo y el promedio general menos el markup de revendedor
6. Si SOLO encuentras precios de agencias/revendedores, aplica -25% como base

=== VEHICULO A ANALIZAR ===

- Marca: ${input.brand}
- Modelo: ${input.model}
- Ano: ${input.year}
- Kilometraje: ${input.mileage.toLocaleString()} km
- Transmision: ${TRANSMISSION_LABELS[input.transmission] || input.transmission}
- Combustible: ${FUEL_LABELS[input.fuel] || input.fuel}
${input.color ? `- Color: ${input.color}` : ""}
${input.doors ? `- Puertas: ${input.doors}` : ""}
${input.engine ? `- Motor: ${input.engine}` : ""}
${input.city ? `- Ciudad: ${input.city}, Venezuela` : "- Ubicacion: Venezuela"}

CONDICIONES:
${activeConditions.length > 0 ? `SI tiene: ${activeConditions.join(", ")}` : "No se especificaron condiciones positivas"}
${missingConditions.length > 0 ? `NO tiene: ${missingConditions.join(", ")}` : ""}

DESCRIPCION DEL VENDEDOR:
${input.description || "No proporcionada"}

=== REGLAS DE PRECIO — SOLO VENEZUELA ===

- SOLO precios del mercado venezolano. NUNCA uses precios de USA, Colombia, Mexico o cualquier otro pais.
- En Venezuela los carros usados cuestan SIGNIFICATIVAMENTE MENOS que en USA/Europa.
- Todos los precios son en USD (moneda estandar para carros usados en Venezuela).
- Si un precio parece de mercado estadounidense o internacional, DESCARTALO.

RANGOS DE REFERENCIA VENEZUELA (USD, 2024-2026) — como guia, NO como limite:
Sedan/Compacto:
  - 1998-2004 (Corolla, Civic, Sentra): $1,800 - $4,500
  - 2005-2010 (Corolla, Aveo, Fiesta, Lancer): $3,000 - $7,000
  - 2011-2015 (Corolla, Cruze, Sentra, Civic): $5,500 - $11,000
  - 2016-2020 (Corolla, Civic, Accent, Sentra): $9,000 - $16,000
  - 2021+ (modelos recientes): $13,000 - $22,000
SUV/Camioneta:
  - 2005-2010 (Fortuner, Hilux, Tahoe, Grand Vitara): $6,000 - $14,000
  - 2011-2015 (Fortuner, Hilux, Tucson, Sportage): $10,000 - $20,000
  - 2016-2020 (Fortuner, Hilux, Tucson, CRV): $16,000 - $28,000
  - 2021+: $22,000 - $38,000
Lujo/Premium (BMW, Mercedes, Audi):
  - Generalmente 25-40% MENOS que precio internacional por altos costos de mantenimiento/repuestos en Venezuela
Rusticos populares venezolanos:
  - Machito/Samurai/Montero viejos: mercado propio, alta demanda, precios variables

CONTEXTO DEL MERCADO VENEZOLANO:
1. Escasez de repuestos: Toyota y Chevrolet tienen la mejor red. Europeos (BMW, Mercedes, Audi) son CARISIMOS de mantener
2. Jerarquia de demanda: Toyota > Chevrolet > Ford > Hyundai > Kia > resto
3. Kilometraje: post-2015 se tolera mas. Pre-2010 con +200k km pierde mucho valor
4. Regional: Caracas 10-15% mas caro. Barcelona/Puerto La Cruz = referencia provincia
5. Papeles vencidos: -15% a -25% del valor
6. Diesel: problematico por escasez. GNV: mercado limitado
7. Automatico: +5-10% vs sincronico
8. El mercado venezolano NO se parece a ningun otro de Latam. No extrapoles

=== INSTRUCCIONES PARA CADA CAMPO DEL JSON ===

- price_min: precio MINIMO realista en Venezuela. Seria el precio de venta rapida/urgente entre particulares
- price_max: precio MAXIMO razonable en Venezuela entre particulares (NO precio de agencia/revendedor inflado). Es referencia, el vendedor puede poner mas si quiere
- price_suggested: precio JUSTO optimo para vender en ~30 dias. Este es el precio que recomendamos a nuestros clientes como punto de partida para la negociacion
- price_market_avg: promedio REAL del mercado venezolano, calculado DESPUES de filtrar precios inflados de revendedores
- confidence: 0-100. Si encontraste +5 publicaciones reales en Venezuela: 70-90. Si encontraste 2-4: 50-70. Si solo estimaste con rangos de referencia: 30-50
- factors_up: MINIMO 2 factores que favorecen un precio mas alto para ESTE vehiculo especifico
- factors_down: MINIMO 2 factores que presionan el precio a la baja para ESTE vehiculo especifico
- argument_min: explicacion del precio minimo. DEBES mencionar: publicaciones reales encontradas (si las hay), comparacion con vehiculos similares en peor condicion, logica de depreciacion. Minimo 4 oraciones en espanol
- argument_max: explicacion del precio maximo. DEBES mencionar: publicaciones reales encontradas (si las hay), si son precios de agencia o particular, que tendria que tener el vehiculo para alcanzar ese precio. Minimo 4 oraciones en espanol
- argument_suggested: por que este precio es el optimo. DEBES explicar: como lo calculaste, que descuento aplicaste a precios de revendedor si fue el caso, por que es justo tanto para comprador como vendedor. Minimo 4 oraciones en espanol
- market_summary: resumen ejecutivo. DEBES incluir: cuantas publicaciones encontraste, rango de precios encontrado, si hay mas oferta o demanda, tendencia (subiendo/bajando/estable), diferencia entre precios de agencia y particular si la detectaste. Minimo 4 oraciones en espanol
- sources: SOLO fuentes que REALMENTE consultaste en tus busquedas. Para CADA fuente incluye: "name" (nombre exacto del portal/fuente) y "detail" (datos CONCRETOS: cuantas publicaciones viste, rango de precios encontrado, si eran de agencia o particular). MINIMO 3 fuentes. Si buscaste y no encontraste nada en una fuente, puedes incluirla diciendo "No se encontraron publicaciones activas"

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
