"use client";

import { useRef, useState } from "react";
import { Upload, X, Film, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { MAX_VIDEO_DURATION_SECONDS } from "@/lib/constants";
import type { WizardData, UploadedVideo } from "@/types/wizard";

interface Props {
  data: WizardData;
  onNext: (values: Partial<WizardData>) => void;
  onBack: () => void;
}

export function WizardStepVideo({ data, onNext, onBack }: Props) {
  const [video, setVideo] = useState<UploadedVideo | null>(data.video);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    // Validate duration client-side
    const duration = await getVideoDuration(file);
    if (duration > MAX_VIDEO_DURATION_SECONDS) {
      setError(`El video no puede durar más de ${MAX_VIDEO_DURATION_SECONDS} segundos`);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const newVideo: UploadedVideo = {
      file,
      previewUrl,
      storagePath: null,
      uploading: true,
    };
    setVideo(newVideo);

    // Upload to Supabase Storage
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "mp4";
    const path = `videos/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("vehicles")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      console.error("Video upload error:", uploadError);
      setError("Error al subir el video. Intenta de nuevo.");
      setVideo(null);
      return;
    }

    setVideo({ file, previewUrl, storagePath: path, uploading: false });
  }

  function removeVideo() {
    if (video?.previewUrl) URL.revokeObjectURL(video.previewUrl);
    setVideo(null);
  }

  function handleNext() {
    if (video?.uploading) {
      setError("Espera a que termine de subir el video");
      return;
    }
    onNext({ video });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        Video del Vehículo
      </h2>
      <p className="text-sm text-muted-foreground">
        Opcional. Sube un video de recorrido del vehículo (máximo{" "}
        {MAX_VIDEO_DURATION_SECONDS} segundos).
      </p>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!video ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 transition-colors hover:border-primary hover:bg-secondary/50"
          >
            <Film className="mb-2 size-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Seleccionar de galería
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              MP4, WebM o MOV. Máximo {MAX_VIDEO_DURATION_SECONDS} seg.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </div>

          <div
            onClick={() => cameraInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-accent/40 bg-accent/5 p-12 transition-colors hover:border-accent hover:bg-accent/10"
          >
            <Camera className="mb-2 size-10 text-accent" />
            <p className="text-sm font-medium text-foreground">
              Grabar video
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Usar cámara del teléfono
            </p>
            <input
              ref={cameraInputRef}
              type="file"
              accept="video/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-lg border border-border">
          {video.uploading ? (
            <div className="flex h-48 items-center justify-center bg-secondary">
              <div className="flex flex-col items-center gap-2">
                <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">
                  Subiendo video...
                </p>
              </div>
            </div>
          ) : (
            <video
              src={video.previewUrl}
              controls
              className="w-full max-h-64 bg-black"
            />
          )}
          <button
            type="button"
            onClick={removeVideo}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-destructive"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          size="lg"
        >
          {video ? "Siguiente" : "Saltar este paso"}
        </Button>
      </div>
    </div>
  );
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });
}
