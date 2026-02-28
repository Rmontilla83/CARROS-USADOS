"use client";

import { useState } from "react";
import { MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback } from "@/lib/actions/feedback";
import type { PriceOpinion } from "@/types";

interface Props {
  vehicleId: string;
}

const OPINIONS: { value: PriceOpinion; label: string; emoji: string }[] = [
  { value: "good_deal", label: "Buen precio", emoji: "👍" },
  { value: "fair", label: "Precio justo", emoji: "👌" },
  { value: "too_expensive", label: "Muy caro", emoji: "😬" },
];

export function FeedbackForm({ vehicleId }: Props) {
  const [opinion, setOpinion] = useState<PriceOpinion | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!opinion) return;
    setSubmitting(true);
    setError(null);

    const result = await submitFeedback({
      vehicle_id: vehicleId,
      price_opinion: opinion,
      comment: comment || undefined,
    });

    setSubmitting(false);
    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error || "Error desconocido");
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 p-4">
        <CheckCircle2 className="size-5 shrink-0 text-accent" />
        <p className="text-sm font-medium text-foreground">
          ¡Gracias por tu opinión!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MessageSquare className="size-4 text-primary" />
        ¿Qué opinas del precio?
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-2">
        {OPINIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setOpinion(o.value)}
            className={`flex-1 rounded-lg border p-2.5 text-center text-sm transition-colors ${
              opinion === o.value
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            <span className="block text-lg">{o.emoji}</span>
            {o.label}
          </button>
        ))}
      </div>

      {opinion && (
        <>
          <Textarea
            placeholder="¿Algún comentario? (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={500}
          />
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            size="sm"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="size-3.5" />
            {submitting ? "Enviando..." : "Enviar opinión"}
          </Button>
        </>
      )}
    </div>
  );
}
