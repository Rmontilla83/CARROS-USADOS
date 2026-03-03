import { createClient } from "@/lib/supabase/server";
import type { Vehicle } from "@/types";

export type SimilarVehicle = Pick<
  Vehicle,
  "id" | "brand" | "model" | "year" | "price" | "slug" | "mileage" | "transmission" | "fuel" | "conditions"
>;

const SIMILAR_LIMIT = 4;

/**
 * Find vehicles similar to the given one.
 * Strategy: same brand, year ±3, price ±40%, status active, excluding current.
 * Fallback: same brand without price/year restriction.
 */
export async function findSimilarVehicles(
  vehicle: Pick<Vehicle, "id" | "brand" | "year" | "price">
): Promise<SimilarVehicle[]> {
  const supabase = await createClient();

  // Primary query: same brand, year ±3, price ±40%
  const yearMin = vehicle.year - 3;
  const yearMax = vehicle.year + 3;
  const priceMin = vehicle.price * 0.6;
  const priceMax = vehicle.price * 1.4;

  const { data: primary } = await supabase
    .from("vehicles")
    .select("id, brand, model, year, price, slug, mileage, transmission, fuel, conditions")
    .eq("status", "active")
    .eq("brand", vehicle.brand)
    .neq("id", vehicle.id)
    .gte("year", yearMin)
    .lte("year", yearMax)
    .gte("price", priceMin)
    .lte("price", priceMax)
    .order("price", { ascending: true })
    .limit(SIMILAR_LIMIT);

  const results = (primary as SimilarVehicle[]) || [];

  if (results.length >= SIMILAR_LIMIT) {
    return results.slice(0, SIMILAR_LIMIT);
  }

  // Fallback: same brand, no price/year restriction
  const existingIds = [vehicle.id, ...results.map((v) => v.id)];
  const remaining = SIMILAR_LIMIT - results.length;

  const { data: fallback } = await supabase
    .from("vehicles")
    .select("id, brand, model, year, price, slug, mileage, transmission, fuel, conditions")
    .eq("status", "active")
    .eq("brand", vehicle.brand)
    .not("id", "in", `(${existingIds.join(",")})`)
    .order("published_at", { ascending: false })
    .limit(remaining);

  return [...results, ...((fallback as SimilarVehicle[]) || [])];
}
