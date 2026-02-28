"use client";

import { ThumbsUp, Scale, AlertTriangle, MessageSquare } from "lucide-react";
import type { PriceOpinion } from "@/types";

interface FeedbackItem {
  price_opinion: string;
  comment: string | null;
  created_at: string;
}

interface Props {
  feedback: FeedbackItem[];
}

const OPINION_CONFIG: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  good_deal: { label: "Buen precio", emoji: "👍", color: "text-accent" },
  fair: { label: "Precio justo", emoji: "👌", color: "text-blue-600" },
  too_expensive: { label: "Muy caro", emoji: "😬", color: "text-orange-600" },
};

export function FeedbackSummary({ feedback }: Props) {
  if (feedback.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <MessageSquare className="mx-auto size-8 text-muted-foreground/30" />
        <p className="mt-2 text-sm text-muted-foreground">
          Aún no hay opiniones sobre este vehículo.
        </p>
      </div>
    );
  }

  // Count opinions
  const counts: Record<string, number> = {};
  for (const f of feedback) {
    counts[f.price_opinion] = (counts[f.price_opinion] || 0) + 1;
  }

  const total = feedback.length;

  // Recent comments
  const comments = feedback.filter((f) => f.comment);

  return (
    <div className="space-y-4">
      {/* Opinion bars */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="mb-3 text-sm font-medium text-foreground">
          {total} opinión{total !== 1 ? "es" : ""} recibida
          {total !== 1 ? "s" : ""}
        </p>
        <div className="space-y-2.5">
          {Object.entries(OPINION_CONFIG).map(([key, config]) => {
            const count = counts[key] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {config.emoji} {config.label}
                  </span>
                  <span className="font-medium text-foreground">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full transition-all ${
                      key === "good_deal"
                        ? "bg-accent"
                        : key === "fair"
                          ? "bg-blue-500"
                          : "bg-orange-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent comments */}
      {comments.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-3 text-sm font-medium text-foreground">
            Comentarios recientes
          </p>
          <div className="space-y-3">
            {comments.slice(0, 5).map((f, i) => {
              const config = OPINION_CONFIG[f.price_opinion];
              const date = new Date(f.created_at).toLocaleDateString("es-VE", {
                day: "numeric",
                month: "short",
              });
              return (
                <div
                  key={i}
                  className="border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {config?.emoji} {config?.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {date}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-foreground">{f.comment}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
