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
  brand: string;
  model: string;
  year: number;
  price: number;
}

type Tab = "vinyl" | "qr";

export function QrPreviewButton({ slug, vehicleName, brand, model, year, price }: Props) {
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [vinylDataUrl, setVinylDataUrl] = useState<string | null>(null);
  const [vehicleUrl, setVehicleUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("vinyl");

  async function handleOpen(open: boolean) {
    if (open && !qrDataUrl) {
      setLoading(true);
      setError(null);
      const result = await generateQrPreview(slug, { brand, model, year, price });
      if (result.success) {
        setQrDataUrl(result.qrDataUrl || null);
        setVinylDataUrl(result.vinylDataUrl || null);
        setVehicleUrl(result.vehicleUrl || null);
      } else {
        setError(result.error || "Error desconocido");
      }
      setLoading(false);
    }
  }

  function handleDownload(dataUrl: string, filename: string) {
    const link = document.createElement("a");
    link.download = filename;
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center">
            {vehicleName}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        {!loading && !error && qrDataUrl && (
          <div className="flex justify-center gap-1 rounded-lg bg-secondary p-1">
            <button
              onClick={() => setActiveTab("vinyl")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === "vinyl"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Arte de Impresion
            </button>
            <button
              onClick={() => setActiveTab("qr")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === "qr"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Solo QR
            </button>
          </div>
        )}

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

          {/* Vinyl art preview */}
          {activeTab === "vinyl" && vinylDataUrl && (
            <>
              <div className="w-full rounded-xl border border-border bg-white p-3 shadow-sm">
                <Image
                  src={vinylDataUrl}
                  alt={`Arte de impresion vinil para ${vehicleName}`}
                  width={600}
                  height={600}
                  className="w-full rounded-lg"
                  unoptimized
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Vinil microperforado 65x65 cm — Este es el arte que se imprime y pega en el carro
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(vinylDataUrl, `vinil-${slug}.png`)}
                  className="gap-1.5"
                >
                  <Download className="size-3.5" />
                  Descargar arte (preview)
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

          {/* QR only preview */}
          {activeTab === "qr" && qrDataUrl && (
            <>
              <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
                <Image
                  src={qrDataUrl}
                  alt={`QR code para ${vehicleName}`}
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
                  onClick={() => handleDownload(qrDataUrl, `qr-${slug}.png`)}
                  className="gap-1.5"
                >
                  <Download className="size-3.5" />
                  Descargar QR
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
