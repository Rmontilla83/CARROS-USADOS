"use client";

import { useState } from "react";
import Image from "next/image";
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
}

export function QrPreviewButton({ slug, vehicleName }: Props) {
  const [loading, setLoading] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [vehicleUrl, setVehicleUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen(open: boolean) {
    if (open && !dataUrl) {
      setLoading(true);
      setError(null);
      const result = await generateQrPreview(slug);
      if (result.success && result.dataUrl) {
        setDataUrl(result.dataUrl);
        setVehicleUrl(result.vehicleUrl || null);
      } else {
        setError(result.error || "Error desconocido");
      }
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `qr-${slug}.png`;
    link.href = dataUrl;
    link.click();
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
            QR — {vehicleName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {loading && (
            <div className="flex flex-col items-center gap-2 py-8">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generando QR...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {dataUrl && (
            <>
              <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
                <Image
                  src={dataUrl}
                  alt={`QR code for ${vehicleName}`}
                  width={280}
                  height={280}
                  className="size-[280px]"
                  unoptimized
                />
              </div>

              {vehicleUrl && (
                <p className="text-xs text-muted-foreground break-all text-center">
                  {vehicleUrl}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-1.5"
                >
                  <Download className="size-3.5" />
                  Descargar PNG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-1.5"
                >
                  <a
                    href={`/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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
