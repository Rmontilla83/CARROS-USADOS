"use client";

import { useState } from "react";
import { Download, QrCode, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateVinyl } from "@/lib/actions/qr";

interface Props {
  vehicleId: string;
  brand: string;
  model: string;
  year: number;
  slug: string;
  existingVinylUrl: string | null;
}

export function VinylDownloadCard({
  vehicleId,
  brand,
  model,
  year,
  slug,
  existingVinylUrl,
}: Props) {
  const [vinylUrl, setVinylUrl] = useState<string | null>(existingVinylUrl);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);

    const result = await generateVinyl(vehicleId);

    setGenerating(false);
    if (result.success && result.vinylUrl) {
      setVinylUrl(result.vinylUrl);
    } else {
      setError(result.error || "Error al generar el vinil");
    }
  }

  async function handleDownload() {
    if (!vinylUrl) return;

    const response = await fetch(vinylUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `vinil-${brand}-${model}-${year}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-foreground">
            {brand} {model} {year}
          </h3>
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            Ver tarjeta
            <ExternalLink className="size-3" />
          </a>
        </div>

        <QrCode className="size-8 shrink-0 text-primary/30" />
      </div>

      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}

      <div className="mt-3">
        {vinylUrl ? (
          <div className="space-y-3">
            {/* Preview */}
            <div className="overflow-hidden rounded-md border border-border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={vinylUrl}
                alt={`Vinil QR - ${brand} ${model} ${year}`}
                loading="lazy"
                className="w-full"
              />
            </div>

            <Button
              onClick={handleDownload}
              size="sm"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Download className="size-4" />
              Descargar QR / Vinil
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleGenerate}
            disabled={generating}
            size="sm"
            variant="outline"
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generando vinil...
              </>
            ) : (
              <>
                <QrCode className="size-4" />
                Generar Vinil QR
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
