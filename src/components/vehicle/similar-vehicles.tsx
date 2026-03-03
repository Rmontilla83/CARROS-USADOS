import Link from "next/link";
import { Car, Gauge, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { findSimilarVehicles } from "@/lib/comparator/find-similar";
import { compareVehicles } from "@/lib/ai/compare-vehicles";
import { ComparisonTable } from "./comparison-table";
import type { Vehicle, Media } from "@/types";

interface SimilarVehiclesProps {
  vehicle: Pick<Vehicle, "id" | "brand" | "model" | "year" | "price" | "slug" | "mileage" | "transmission" | "fuel" | "conditions">;
}

export async function SimilarVehicles({ vehicle }: SimilarVehiclesProps) {
  const similarVehicles = await findSimilarVehicles(vehicle);

  if (similarVehicles.length === 0) return null;

  const supabase = await createClient();

  // Fetch covers for similar vehicles
  const vehicleIds = similarVehicles.map((v) => v.id);
  const { data: covers } = await supabase
    .from("media")
    .select("vehicle_id, url")
    .in("vehicle_id", vehicleIds)
    .eq("type", "photo")
    .eq("is_cover", true);

  const coverMap = new Map<string, string>();
  if (covers) {
    for (const c of covers as Pick<Media, "vehicle_id" | "url">[]) {
      coverMap.set(c.vehicle_id, c.url);
    }
  }

  // AI comparison (only if we have similar vehicles)
  const comparison = similarVehicles.length >= 1
    ? await compareVehicles(vehicle, similarVehicles)
    : null;

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Vehículos similares
      </h2>

      {/* AI Comparison Table */}
      {comparison && (
        <ComparisonTable
          mainVehicle={vehicle as Vehicle}
          similarVehicles={similarVehicles as Vehicle[]}
          comparison={comparison}
        />
      )}

      {/* Similar vehicles grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {similarVehicles.map((similar) => {
          const coverUrl = coverMap.get(similar.id);
          return (
            <Link
              key={similar.id}
              href={`/${similar.slug}`}
              className="group flex gap-3 rounded-xl border border-border bg-white p-3 shadow-sm transition-all hover:shadow-md"
            >
              <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={`${similar.brand} ${similar.model} ${similar.year}`}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <Car className="size-8 text-muted-foreground/20" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {similar.brand} {similar.model} {similar.year}
                </p>
                <p className="text-base font-extrabold text-accent">
                  ${similar.price.toLocaleString("en-US")}
                </p>
                {similar.mileage != null && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Gauge className="size-3" />
                    {similar.mileage.toLocaleString()} km
                  </p>
                )}
              </div>
              <ArrowRight className="mt-2 size-4 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
