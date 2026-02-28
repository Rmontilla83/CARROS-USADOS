"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Sparkles } from "lucide-react";

interface Props {
  price: number;
  min: number;
  max: number;
  avg?: number;
  factorsUp?: string[];
  factorsDown?: string[];
  summary?: string;
}

export function PriceAnalysisCard({ price, min, max, avg, factorsUp, factorsDown, summary }: Props) {
  const [expanded, setExpanded] = useState(false);

  const range = max - min;
  const position = range > 0 ? Math.max(0, Math.min(100, ((price - min) / range) * 100)) : 50;

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-secondary/30"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent" />
          <span className="text-sm font-bold text-foreground">
            ¿Por que este precio?
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-border px-5 pb-5 pt-4">
          {/* Range bar */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Rango de mercado
            </p>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-muted-foreground">${min.toLocaleString("en-US")}</span>
              {avg && <span className="text-muted-foreground">${avg.toLocaleString("en-US")}</span>}
              <span className="text-muted-foreground">${max.toLocaleString("en-US")}</span>
            </div>
            <div className="relative h-2.5 rounded-full bg-gradient-to-r from-green-300 via-blue-300 to-yellow-300">
              <div
                className="absolute top-1/2 -translate-y-1/2 size-4 rounded-full border-2 border-white bg-primary shadow-md"
                style={{ left: `calc(${position}% - 8px)` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Bajo</span>
              {avg && <span>Promedio</span>}
              <span>Alto</span>
            </div>
          </div>

          {/* Factors */}
          {((factorsUp && factorsUp.length > 0) || (factorsDown && factorsDown.length > 0)) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {factorsUp && factorsUp.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-1.5">
                    <TrendingUp className="size-3 text-green-600" />
                    <span className="text-[11px] font-bold text-green-700">A favor</span>
                  </div>
                  <ul className="space-y-0.5">
                    {factorsUp.slice(0, 3).map((f) => (
                      <li key={f} className="text-xs text-green-700">+ {f}</li>
                    ))}
                  </ul>
                </div>
              )}
              {factorsDown && factorsDown.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-1.5">
                    <TrendingDown className="size-3 text-orange-600" />
                    <span className="text-[11px] font-bold text-orange-700">En contra</span>
                  </div>
                  <ul className="space-y-0.5">
                    {factorsDown.slice(0, 3).map((f) => (
                      <li key={f} className="text-xs text-orange-700">- {f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {summary && (
            <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
              {summary}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
