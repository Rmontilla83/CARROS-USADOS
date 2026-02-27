"use client";

import { useState } from "react";
import { Car, DollarSign, Camera, Film, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { VEHICLE_CONDITIONS } from "@/lib/constants";
import { publishVehicle } from "@/lib/actions/vehicle";
import type { WizardData } from "@/types/wizard";

interface Props {
  data: WizardData;
  onBack: () => void;
}

const TRANSMISSION_LABELS: Record<string, string> = {
  manual: "Manual",
  automatic: "Automática",
  cvt: "CVT",
};

const FUEL_LABELS: Record<string, string> = {
  gasoline: "Gasolina",
  diesel: "Diésel",
  electric: "Eléctrico",
  hybrid: "Híbrido",
  gas: "Gas",
};

export function WizardStepSummary({ data, onBack }: Props) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeConditions = VEHICLE_CONDITIONS.filter(
    (c) => data.conditions[c.key]
  );

  async function handlePublish() {
    setIsPublishing(true);
    setError(null);

    const photoStoragePaths = data.photos
      .map((p) => p.storagePath)
      .filter((p): p is string => p !== null);

    const result = await publishVehicle({
      brand: data.brand,
      model: data.model,
      year: data.year,
      mileage: data.mileage,
      color: data.color,
      transmission: data.transmission,
      fuel: data.fuel,
      plate: data.plate || undefined,
      engine: data.engine || undefined,
      doors: data.doors,
      price: data.price,
      description: data.description || undefined,
      conditions: data.conditions,
      photoStoragePaths,
      coverPhotoIndex: data.coverPhotoIndex,
      videoStoragePath: data.video?.storagePath || undefined,
    });

    // If we get here, redirect didn't happen, so there's an error
    if (result?.error) {
      setError(result.error);
      setIsPublishing(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">
        Resumen de Publicación
      </h2>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Vehicle info */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Car className="size-4" />
          Datos del Vehículo
        </div>
        <Separator className="my-3" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Marca:</span>{" "}
            <span className="font-medium">{data.brand}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Modelo:</span>{" "}
            <span className="font-medium">{data.model}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Año:</span>{" "}
            <span className="font-medium">{data.year}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Km:</span>{" "}
            <span className="font-medium">
              {data.mileage.toLocaleString()} km
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Color:</span>{" "}
            <span className="font-medium">{data.color}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Transmisión:</span>{" "}
            <span className="font-medium">
              {TRANSMISSION_LABELS[data.transmission]}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Combustible:</span>{" "}
            <span className="font-medium">{FUEL_LABELS[data.fuel]}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Puertas:</span>{" "}
            <span className="font-medium">{data.doors}</span>
          </div>
          {data.plate && (
            <div>
              <span className="text-muted-foreground">Placa:</span>{" "}
              <span className="font-medium">{data.plate}</span>
            </div>
          )}
          {data.engine && (
            <div>
              <span className="text-muted-foreground">Motor:</span>{" "}
              <span className="font-medium">{data.engine}</span>
            </div>
          )}
        </div>
      </div>

      {/* Photos */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Camera className="size-4" />
          Fotos ({data.photos.length})
        </div>
        <Separator className="my-3" />
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {data.photos.map((photo, i) => (
            <div
              key={photo.id}
              className={`relative aspect-[4/3] overflow-hidden rounded-md border ${
                i === data.coverPhotoIndex
                  ? "border-2 border-accent"
                  : "border-border"
              }`}
            >
              <img
                src={photo.previewUrl}
                alt={`Foto ${i + 1}`}
                className="size-full object-cover"
              />
              {i === data.coverPhotoIndex && (
                <div className="absolute left-0.5 top-0.5 rounded bg-accent px-1 text-[8px] font-bold text-accent-foreground">
                  PORTADA
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Video */}
      {data.video && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Film className="size-4" />
            Video
          </div>
          <Separator className="my-3" />
          <video
            src={data.video.previewUrl}
            controls
            className="w-full max-h-48 rounded-md bg-black"
          />
        </div>
      )}

      {/* Price */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <DollarSign className="size-4" />
          Precio
        </div>
        <Separator className="my-3" />
        <p className="text-2xl font-bold text-foreground">
          ${data.price.toLocaleString("en-US", { minimumFractionDigits: 0 })}
        </p>
      </div>

      {/* Description + Conditions */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <FileText className="size-4" />
          Descripción y Condiciones
        </div>
        <Separator className="my-3" />
        {data.description ? (
          <p className="mb-3 whitespace-pre-line text-sm text-foreground">
            {data.description}
          </p>
        ) : (
          <p className="mb-3 text-sm text-muted-foreground italic">
            Sin descripción
          </p>
        )}
        {activeConditions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeConditions.map((c) => (
              <Badge
                key={c.key}
                variant="secondary"
                className="flex items-center gap-1"
              >
                <CheckCircle2 className="size-3" />
                {c.label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isPublishing}
        >
          Atrás
        </Button>
        <Button
          type="button"
          onClick={handlePublish}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          size="lg"
          disabled={isPublishing}
        >
          {isPublishing ? "Publicando..." : "Publicar Vehículo"}
        </Button>
      </div>
    </div>
  );
}
