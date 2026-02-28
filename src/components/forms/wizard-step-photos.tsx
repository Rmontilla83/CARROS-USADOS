"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Star, GripVertical, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { MIN_PHOTOS, MAX_PHOTOS } from "@/lib/constants";
import { PhotoGuide } from "@/components/forms/photo-guide";
import { compressImage } from "@/lib/image/compress";
import type { WizardData, UploadedPhoto } from "@/types/wizard";

interface Props {
  data: WizardData;
  onNext: (values: Partial<WizardData>) => void;
  onBack: () => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export function WizardStepPhotos({ data, onNext, onBack }: Props) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>(data.photos);
  const [coverIndex, setCoverIndex] = useState(data.coverPhotoIndex);
  const [error, setError] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadToStorage = useCallback(
    async (photo: UploadedPhoto): Promise<UploadedPhoto> => {
      const supabase = createClient();
      const ext = photo.file.name.split(".").pop() || "jpg";
      const path = `photos/${Date.now()}-${photo.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("vehicles")
        .upload(path, photo.file, { upsert: false });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setError(
          uploadError.message.includes("not found")
            ? "Error: El bucket de almacenamiento no existe. Contacta al administrador."
            : `Error al subir foto: ${uploadError.message}`
        );
        return { ...photo, uploading: false };
      }

      return { ...photo, storagePath: path, uploading: false };
    },
    []
  );

  async function handleFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    const remaining = MAX_PHOTOS - photos.length;

    if (remaining <= 0) {
      setError(`Máximo ${MAX_PHOTOS} fotos permitidas`);
      return;
    }

    const toAdd = fileArray.slice(0, remaining);
    setError(null);

    // Compress images client-side before upload (max 2MB each)
    const compressed = await Promise.all(
      toAdd.map((file) => compressImage(file).catch(() => file))
    );

    // Create preview entries
    const newPhotos: UploadedPhoto[] = compressed.map((file) => ({
      id: generateId(),
      file,
      previewUrl: URL.createObjectURL(file),
      storagePath: null,
      uploading: true,
    }));

    const updated = [...photos, ...newPhotos];
    setPhotos(updated);

    // Upload each in parallel
    const uploaded = await Promise.all(newPhotos.map(uploadToStorage));

    setPhotos((prev) => {
      const map = new Map(uploaded.map((p) => [p.id, p]));
      return prev.map((p) => map.get(p.id) || p);
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function removePhoto(index: number) {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    if (coverIndex === index) setCoverIndex(0);
    else if (coverIndex > index) setCoverIndex(coverIndex - 1);
  }

  // Drag reorder handlers
  function handleDragStart(index: number) {
    dragItemRef.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDragEnd() {
    if (dragItemRef.current === null || dragOverIndex === null) {
      setDragOverIndex(null);
      return;
    }

    const from = dragItemRef.current;
    const to = dragOverIndex;

    if (from !== to) {
      const reordered = [...photos];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);
      setPhotos(reordered);

      // Adjust cover index
      if (coverIndex === from) setCoverIndex(to);
      else if (from < coverIndex && to >= coverIndex) setCoverIndex(coverIndex - 1);
      else if (from > coverIndex && to <= coverIndex) setCoverIndex(coverIndex + 1);
    }

    dragItemRef.current = null;
    setDragOverIndex(null);
  }

  function handleNext() {
    const uploading = photos.some((p) => p.uploading);
    if (uploading) {
      setError("Espera a que terminen de subir las fotos");
      return;
    }
    const uploadedPhotos = photos.filter((p) => p.storagePath !== null);
    const failedCount = photos.length - uploadedPhotos.length;
    if (uploadedPhotos.length < MIN_PHOTOS) {
      if (failedCount > 0) {
        setError(
          `${failedCount} foto(s) fallaron al subir. Elimínalas e intenta de nuevo. Necesitas al menos ${MIN_PHOTOS} fotos subidas correctamente.`
        );
      } else {
        setError(`Sube al menos ${MIN_PHOTOS} fotos`);
      }
      return;
    }
    onNext({ photos, coverPhotoIndex: coverIndex });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        Fotos del Vehículo
      </h2>
      <p className="text-sm text-muted-foreground">
        Mínimo {MIN_PHOTOS} fotos, máximo {MAX_PHOTOS}. La primera foto será la
        portada por defecto. Arrastra para reordenar.
      </p>

      <PhotoGuide />

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Drop zone + camera */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary hover:bg-secondary/50"
        >
          <Upload className="mb-2 size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Seleccionar de galería
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPG, PNG o WebP. {photos.length}/{MAX_PHOTOS} fotos
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <div
          onClick={() => cameraInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-accent/40 bg-accent/5 p-8 transition-colors hover:border-accent hover:bg-accent/10"
        >
          <Camera className="mb-2 size-8 text-accent" />
          <p className="text-sm font-medium text-foreground">
            Tomar foto
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Usar cámara del teléfono
          </p>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative aspect-[4/3] overflow-hidden rounded-lg border-2 ${
                dragOverIndex === index
                  ? "border-primary"
                  : coverIndex === index
                  ? "border-accent"
                  : "border-border"
              } ${photo.uploading ? "opacity-60" : ""}`}
            >
              <img
                src={photo.previewUrl}
                alt={`Foto ${index + 1}`}
                className="size-full object-cover"
              />

              {/* Uploading overlay */}
              {photo.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="size-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}

              {/* Failed overlay */}
              {!photo.uploading && !photo.storagePath && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
                  <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    ERROR
                  </span>
                </div>
              )}

              {/* Cover badge */}
              {coverIndex === index && (
                <div className="absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                  PORTADA
                </div>
              )}

              {/* Actions overlay */}
              <div className="absolute inset-0 flex items-start justify-end gap-1 bg-black/0 p-1 opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCoverIndex(index);
                  }}
                  title="Marcar como portada"
                  className="rounded bg-black/50 p-1 text-white hover:bg-accent"
                >
                  <Star className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(index);
                  }}
                  title="Eliminar"
                  className="rounded bg-black/50 p-1 text-white hover:bg-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              {/* Drag handle */}
              <div className="absolute bottom-1 left-1 rounded bg-black/50 p-0.5 text-white opacity-0 group-hover:opacity-100">
                <GripVertical className="size-3.5" />
              </div>
            </div>
          ))}
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
          Siguiente
        </Button>
      </div>
    </div>
  );
}
