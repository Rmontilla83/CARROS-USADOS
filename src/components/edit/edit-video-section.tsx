"use client";

import { useRef, useState } from "react";
import { Film, Camera, X, Loader2, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { MAX_VIDEO_DURATION_SECONDS } from "@/lib/constants";
import { updateVehicle } from "@/lib/actions/vehicle";

interface Props {
  vehicleId: string;
  initialVideoUrl: string | null;
  initialVideoStoragePath: string | null;
}

export function EditVideoSection({
  vehicleId,
  initialVideoUrl,
  initialVideoStoragePath,
}: Props) {
  const [videoUrl, setVideoUrl] = useState<string | null>(initialVideoUrl);
  const [videoStoragePath, setVideoStoragePath] = useState<string | null>(
    initialVideoStoragePath
  );
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [newVideoPreview, setNewVideoPreview] = useState<string | null>(null);
  const [newVideoPath, setNewVideoPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [removedPath, setRemovedPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setSuccess(false);

    const duration = await getVideoDuration(file);
    if (duration > MAX_VIDEO_DURATION_SECONDS) {
      setError(
        `El video no puede durar más de ${MAX_VIDEO_DURATION_SECONDS} segundos`
      );
      return;
    }

    // If there was an existing video, mark it for removal
    if (videoStoragePath) {
      setRemovedPath(videoStoragePath);
      setVideoUrl(null);
      setVideoStoragePath(null);
    }

    setNewVideoFile(file);
    setNewVideoPreview(URL.createObjectURL(file));
    setUploading(true);

    const supabase = createClient();
    const ext = file.name.split(".").pop() || "mp4";
    const path = `videos/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("vehicles")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      console.error("Video upload error:", uploadError);
      setError("Error al subir el video. Intenta de nuevo.");
      setNewVideoFile(null);
      setNewVideoPreview(null);
      setUploading(false);
      return;
    }

    setNewVideoPath(path);
    setUploading(false);
  }

  function removeCurrentVideo() {
    setSuccess(false);
    if (videoStoragePath) {
      setRemovedPath(videoStoragePath);
      setVideoUrl(null);
      setVideoStoragePath(null);
    }
    if (newVideoPreview) {
      URL.revokeObjectURL(newVideoPreview);
      setNewVideoFile(null);
      setNewVideoPreview(null);
      setNewVideoPath(null);
    }
  }

  async function handleSave() {
    if (uploading) {
      setError("Espera a que termine de subir el video");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await updateVehicle({
      vehicleId,
      videoStoragePath: newVideoPath,
      removedVideoStoragePath: removedPath || undefined,
    });

    if (result.success) {
      setSuccess(true);
      // Update local state to reflect saved state
      if (newVideoPath) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        setVideoUrl(
          `${supabaseUrl}/storage/v1/object/public/vehicles/${newVideoPath}`
        );
        setVideoStoragePath(newVideoPath);
        setNewVideoFile(null);
        setNewVideoPreview(null);
        setNewVideoPath(null);
      }
      setRemovedPath(null);
    } else {
      setError(result.error || "Error al guardar");
    }
    setSaving(false);
  }

  const hasVideo = videoUrl || newVideoPreview;
  const hasChanges = removedPath || newVideoPath;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Opcional. Video de recorrido del vehículo (máximo{" "}
        {MAX_VIDEO_DURATION_SECONDS} segundos).
      </p>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {hasVideo ? (
        <div className="relative overflow-hidden rounded-lg border border-border">
          {uploading ? (
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
              src={newVideoPreview || videoUrl || undefined}
              controls
              className="w-full max-h-64 bg-black"
            />
          )}
          <button
            type="button"
            onClick={removeCurrentVideo}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-destructive"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
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
      )}

      {/* Feedback + Save */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
          <CheckCircle2 className="size-4 text-accent" />
          <p className="text-sm font-medium text-accent">Video actualizado</p>
        </div>
      )}

      {hasChanges && (
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || uploading}
          className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Guardar video
        </Button>
      )}
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
