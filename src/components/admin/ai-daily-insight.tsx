"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateDailyInsight } from "@/lib/actions/admin";

export function AiDailyInsight() {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchInsight() {
    setLoading(true);
    setError(null);
    const result = await generateDailyInsight();
    if (result.success && result.insight) {
      setInsight(result.insight);
    } else {
      setError(result.error || "Error al generar insight");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchInsight();
  }, []);

  return (
    <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Sparkles className="size-4 text-accent" />
          Insight del dia — Gemini AI
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchInsight}
          disabled={loading}
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
          title="Regenerar insight"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-3">
          <Loader2 className="size-4 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">Analizando datos de la plataforma...</p>
        </div>
      )}

      {error && !loading && (
        <p className="text-sm text-muted-foreground italic">{error}</p>
      )}

      {insight && !loading && (
        <p className="text-sm leading-relaxed text-foreground/90">{insight}</p>
      )}
    </div>
  );
}
