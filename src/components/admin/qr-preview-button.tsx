"use client";

import { useState } from "react";
import { QrCode, Loader2, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { generateQrPreview } from "@/lib/actions/admin";

interface Props {
  slug: string;
  vehicleName: string;
  brand: string;
  model: string;
  year: number;
  price: number;
}

export function QrPreviewButton({ slug, vehicleName }: Props) {
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen(open: boolean) {
    if (open && !qrDataUrl) {
      setLoading(true);
      setError(null);
      const result = await generateQrPreview(slug);
      if (result.success && result.qrDataUrl) {
        setQrDataUrl(result.qrDataUrl);
        setSiteUrl(result.siteUrl || null);
      } else {
        setError(result.error || "Error desconocido");
      }
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!qrDataUrl || !siteUrl) return;
    const canvas = document.createElement("canvas");
    const size = 2400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // White background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size);

    // Top accent line
    ctx.fillStyle = "#1B4F72";
    ctx.fillRect(0, 0, size, 12);

    // "SE VENDE" header
    ctx.fillStyle = "#1B4F72";
    ctx.textAlign = "center";
    ctx.font = "900 180px Arial, Helvetica, sans-serif";
    ctx.fillText("SE VENDE", size / 2, 260);

    // Subtle divider line
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(size * 0.15, 310);
    ctx.lineTo(size * 0.85, 310);
    ctx.stroke();

    // QR code — big
    const qrImg = new Image();
    qrImg.onload = () => {
      const qrSize = size * 0.72;
      const qrX = (size - qrSize) / 2;
      const qrY = 380;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Bottom divider
      ctx.strokeStyle = "#E5E7EB";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(size * 0.15, qrY + qrSize + 50);
      ctx.lineTo(size * 0.85, qrY + qrSize + 50);
      ctx.stroke();

      // Website URL
      const shortSite = siteUrl.replace(/^https?:\/\//, "");
      ctx.fillStyle = "#1B4F72";
      ctx.font = "700 56px Arial, Helvetica, sans-serif";
      ctx.fillText(shortSite, size / 2, qrY + qrSize + 120);

      // Bottom accent line
      ctx.fillStyle = "#1B4F72";
      ctx.fillRect(0, size - 12, size, 12);

      const link = document.createElement("a");
      link.download = `vinil-${slug}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    qrImg.src = qrDataUrl;
  }

  return (
    <Dialog onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-primary hover:bg-primary/10"
          title="Ver QR"
        >
          <QrCode className="size-3.5" />
          <span className="hidden sm:inline">QR</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Arte de Impresion — {vehicleName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {loading && (
            <div className="flex flex-col items-center gap-2 py-8">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generando vista previa...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {qrDataUrl && (
            <>
              {/* Vinyl art preview — clean professional design */}
              <div className="w-full overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                {/* Top accent bar */}
                <div className="h-1.5 bg-primary" />

                <div className="flex flex-col items-center gap-2 px-6 py-5">
                  {/* SE VENDE */}
                  <h2 className="text-3xl font-black tracking-[0.15em] text-primary sm:text-4xl">
                    SE VENDE
                  </h2>

                  {/* Divider */}
                  <div className="h-px w-3/4 bg-border" />

                  {/* QR — large */}
                  <div className="my-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrDataUrl}
                      alt="QR code"
                      className="size-[240px] sm:size-[280px]"
                    />
                  </div>

                  {/* Divider */}
                  <div className="h-px w-3/4 bg-border" />

                  {/* Site URL */}
                  {siteUrl && (
                    <p className="text-sm font-bold tracking-wide text-primary">
                      {siteUrl.replace(/^https?:\/\//, "")}
                    </p>
                  )}
                </div>

                {/* Bottom accent bar */}
                <div className="h-1.5 bg-primary" />
              </div>

              <p className="text-[11px] text-muted-foreground text-center">
                Vinil microperforado 65 x 65 cm — Se imprime y pega en el vidrio trasero
              </p>

              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-1.5"
                >
                  <Download className="size-3.5" />
                  Descargar arte
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-1.5"
                >
                  <a href={`/${slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5" />
                    Ver tarjeta
                  </a>
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
