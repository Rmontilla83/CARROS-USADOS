import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod/v4";
import type { Vehicle } from "@/types";

type ComparisonVehicle = Pick<
  Vehicle,
  "id" | "brand" | "model" | "year" | "price" | "mileage" | "transmission" | "fuel" | "conditions"
>;

const comparisonResponseSchema = z.object({
  best_deal_id: z.string(),
  best_deal_reason: z.string(),
  summary: z.string(),
  vehicles: z.array(
    z.object({
      id: z.string(),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
      value_score: z.number().min(1).max(10),
    })
  ),
});

export type ComparisonResult = z.infer<typeof comparisonResponseSchema>;

const TRANSMISSION_LABELS: Record<string, string> = {
  automatic: "Automática",
  manual: "Manual",
  cvt: "CVT",
};

const FUEL_LABELS: Record<string, string> = {
  gasoline: "Gasolina",
  diesel: "Diésel",
  electric: "Eléctrico",
  hybrid: "Híbrido",
  gas: "Gas",
};

export async function compareVehicles(
  mainVehicle: ComparisonVehicle,
  similarVehicles: ComparisonVehicle[]
): Promise<ComparisonResult | null> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return null;

  const allVehicles = [mainVehicle, ...similarVehicles];

  const vehiclesDescription = allVehicles
    .map((v) => {
      const conditions = v.conditions
        ? Object.entries(v.conditions)
            .filter(([, val]) => val)
            .map(([key]) => key)
            .join(", ")
        : "N/A";

      return `ID: ${v.id}
- ${v.brand} ${v.model} ${v.year}
- Precio: $${v.price.toLocaleString()}
- Kilometraje: ${v.mileage?.toLocaleString() ?? "N/A"} km
- Transmisión: ${TRANSMISSION_LABELS[v.transmission] || v.transmission}
- Combustible: ${FUEL_LABELS[v.fuel] || v.fuel}
- Condiciones: ${conditions}`;
    })
    .join("\n\n");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Eres un asesor automotriz especializado en el mercado venezolano de vehículos usados. Compara estos vehículos y ayuda al comprador a decidir.

VEHÍCULOS A COMPARAR:
${vehiclesDescription}

CONTEXTO VENEZUELA:
- Toyota y Chevrolet tienen los repuestos más accesibles
- Automático cuesta 5-10% más que sincrónico
- Papeles al día es crucial (sin papeles pierde 15-25% del valor)
- Kilometraje alto (>200k km) reduce significativamente el valor en modelos pre-2010

INSTRUCCIONES:
1. Identifica cuál es la mejor opción de compra (mejor relación valor/precio)
2. Da pros y contras específicos y concretos para cada vehículo
3. Asigna un value_score del 1 al 10 basado en relación calidad/precio para el mercado venezolano
4. El resumen debe ser objetivo y útil para el comprador

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin backticks):
{
  "best_deal_id": "uuid del mejor",
  "best_deal_reason": "razón breve en español",
  "summary": "resumen comparativo de 2-3 oraciones en español",
  "vehicles": [
    {
      "id": "uuid",
      "pros": ["pro1", "pro2"],
      "cons": ["con1", "con2"],
      "value_score": 7
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    let jsonStr = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);
    return comparisonResponseSchema.parse(parsed);
  } catch (err) {
    console.error("AI comparison error:", err);
    return null;
  }
}
