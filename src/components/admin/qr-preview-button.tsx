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

export function QrPreviewButton({ slug, vehicleName, brand, model, year, price }: Props) {
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [vehicleUrl, setVehicleUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen(open: boolean) {
    if (open && !qrDataUrl) {
      setLoading(true);
      setError(null);
      const result = await generateQrPreview(slug);
      if (result.success && result.qrDataUrl) {
        setQrDataUrl(result.qrDataUrl);
        setVehicleUrl(result.vehicleUrl || null);
      } else {
        setError(result.error || "Error desconocido");
      }
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!qrDataUrl) return;
    // Draw the full vinyl art to a canvas and download
    const canvas = document.createElement("canvas");
    const size = 2000;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // White background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size);

    // "SE VENDE" header
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.font = "900 140px Arial Black, Impact, Arial, sans-serif";
    ctx.letterSpacing = "8px";
    ctx.fillText("SE VENDE", size / 2, 200);

    // QR code
    const qrImg = new Image();
    qrImg.onload = () => {
      const qrSize = size * 0.65;
      const qrX = (size - qrSize) / 2;
      const qrY = 280;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Vehicle info
      ctx.fillStyle = "#000000";
      ctx.font = "700 52px Arial, sans-serif";
      ctx.fillText(`${brand} ${model} ${year}`, size / 2, qrY + qrSize + 80);

      // Price
      ctx.font = "900 72px Arial Black, Impact, Arial, sans-serif";
      ctx.fillText(`$${price.toLocaleString("en-US")}`, size / 2, qrY + qrSize + 160);

      // URL
      ctx.font = "600 36px Arial, sans-serif";
      ctx.fillStyle = "#555555";
      const shortUrl = vehicleUrl?.replace(/^https?:\/\//, "") || slug;
      ctx.fillText(shortUrl, size / 2, qrY + qrSize + 220);

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
            Arte de Impresion
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
              {/* Vinyl art preview rendered client-side */}
              <div className="w-full rounded-xl border-2 border-dashed border-border bg-white p-6 shadow-sm">
                <div className="flex flex-col items-center gap-3">
                  {/* SE VENDE */}
                  <h2
                    className="text-3xl font-black tracking-widest text-black sm:text-4xl"
                    style={{ fontFamily: "Arial Black, Impact, sans-serif" }}
                  >
                    SE VENDE
                  </h2>

                  {/* QR */}
                  <div className="my-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrDataUrl}
                      alt={`QR code para ${vehicleName}`}
                      className="size-[220px] sm:size-[260px]"
                    />
                  </div>

                  {/* Vehicle info */}
                  <p className="text-lg font-bold text-black">
                    {brand} {model} {year}
                  </p>

                  {/* Price */}
                  <p
                    className="text-2xl font-black text-black sm:text-3xl"
                    style={{ fontFamily: "Arial Black, Impact, sans-serif" }}
                  >
                    ${price.toLocaleString("en-US")}
                  </p>

                  {/* URL */}
                  {vehicleUrl && (
                    <p className="text-xs text-gray-500 break-all">
                      {vehicleUrl.replace(/^https?:\/\//, "")}
                    </p>
                  )}
                </div>
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
