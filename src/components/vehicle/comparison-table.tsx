"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Star, Trophy } from "lucide-react";
import type { ComparisonResult } from "@/lib/ai/compare-vehicles";
import type { Vehicle } from "@/types";

type ComparisonVehicle = Pick<
  Vehicle,
  "id" | "brand" | "model" | "year" | "price" | "mileage" | "transmission" | "fuel" | "slug"
>;

const TRANSMISSION_LABELS: Record<string, string> = {
  automatic: "Automática",
  manual: "Manual",
  cvt: "CVT",
};

interface ComparisonTableProps {
  mainVehicle: ComparisonVehicle;
  similarVehicles: ComparisonVehicle[];
  comparison: ComparisonResult;
}

export function ComparisonTable({
  mainVehicle,
  similarVehicles,
  comparison,
}: ComparisonTableProps) {
  const [expanded, setExpanded] = useState(false);
  const allVehicles = [mainVehicle, ...similarVehicles];

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-5"
      >
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-accent" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Comparativa IA
          </h3>
        </div>
        {expanded ? (
          <ChevronUp className="size-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border p-5 pt-4">
          {/* Summary */}
          <p className="text-sm leading-relaxed text-foreground">
            {comparison.summary}
          </p>

          {/* Vehicle comparison cards */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {allVehicles.map((v) => {
              const vehicleComparison = comparison.vehicles.find(
                (cv) => cv.id === v.id
              );
              const isBestDeal = comparison.best_deal_id === v.id;
              const isMain = v.id === mainVehicle.id;

              return (
                <div
                  key={v.id}
                  className={`rounded-xl border p-4 ${
                    isBestDeal
                      ? "border-accent bg-accent/5"
                      : isMain
                        ? "border-primary/30 bg-primary/5"
                        : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {v.brand} {v.model} {v.year}
                      </p>
                      <p className="text-lg font-extrabold text-accent">
                        ${v.price.toLocaleString("en-US")}
                      </p>
                    </div>
                    {isBestDeal && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                        <Trophy className="size-3" />
                        Mejor opción
                      </span>
                    )}
                    {isMain && !isBestDeal && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        Actual
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{v.mileage?.toLocaleString() ?? "N/A"} km</span>
                    <span>{TRANSMISSION_LABELS[v.transmission]}</span>
                  </div>

                  {vehicleComparison && (
                    <>
                      {/* Value score */}
                      <div className="mt-3 flex items-center gap-1.5">
                        <Star className="size-3.5 text-amber-500" />
                        <span className="text-sm font-bold text-foreground">
                          {vehicleComparison.value_score}/10
                        </span>
                        <span className="text-xs text-muted-foreground">
                          valor/precio
                        </span>
                      </div>

                      {/* Pros */}
                      {vehicleComparison.pros.length > 0 && (
                        <div className="mt-2">
                          {vehicleComparison.pros.map((pro, i) => (
                            <p
                              key={i}
                              className="text-xs leading-relaxed text-green-700"
                            >
                              + {pro}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Cons */}
                      {vehicleComparison.cons.length > 0 && (
                        <div className="mt-1">
                          {vehicleComparison.cons.map((con, i) => (
                            <p
                              key={i}
                              className="text-xs leading-relaxed text-red-600"
                            >
                              - {con}
                            </p>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Best deal reason */}
          <div className="mt-4 rounded-lg bg-accent/5 p-3">
            <p className="text-xs font-bold text-accent">
              Mejor opción:{" "}
              <span className="font-normal text-foreground">
                {comparison.best_deal_reason}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
