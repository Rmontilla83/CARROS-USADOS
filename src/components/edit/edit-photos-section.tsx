"use client";

import { useCallback, useRef, useState } from "react";
import {
  Upload,
  X,
  Star,
  GripVertical,
  Camera,
  Loader2,
  Save,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { MIN_PHOTOS, MAX_PHOTOS } from "@/lib/constants";
import { compressImage } from "@/lib/image/compress";
import { updateVehicle } from "@/lib/actions/vehicle";
import type {
  EditablePhoto,
  NewPhoto,
  ExistingPhoto,
  isNewPhoto as isNewPhotoFn,
} from "@/types/edit-vehicle";

interface Props {
  vehicleId: string;
  initialPhotos: ExistingPhoto[];
  initialCoverIndex: number;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export function EditPhotosSection({
  vehicleId,
  initialPhotos,
  initialCoverIndex,
}: Props) {
  const [photos, setPhotos] = useState<EditablePhoto[]>(initialPhotos);
  const [coverIndex, setCoverIndex] = useState(initialCoverIndex);
  const [removedPaths, setRemovedPaths] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function isNew(photo: EditablePhoto): photo is NewPhoto {
    return photo.kind === "new";
  }

  const uploadToStorage = useCallback(
    async (photo: NewPhoto): Promise<NewPhoto> => {
      const supabase = createClient();
      const ext = photo.file.name.split(".").pop() || "jpg";
      const path = `photos/${Date.now()}-${photo.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("vehicles")
        .upload(path, photo.file, { upsert: false });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setError(`Error al subir foto: ${uploadError.message}`);
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
    setSuccess(false);

    const compressed = await Promise.all(
      toAdd.map((file) => compressImage(file).catch(() => file))
    );

    const newPhotos: NewPhoto[] = compressed.map((file) => ({
      kind: "new" as const,
      id: generateId(),
      file,
      previewUrl: URL.createObjectURL(file),
      storagePath: null,
      uploading: true,
    }));

    const updated = [...photos, ...newPhotos];
    setPhotos(updated);

    const uploaded = await Promise.all(newPhotos.map(uploadToStorage));

    setPhotos((prev) => {
      const map = new Map(uploaded.map((p) => [p.id, p]));
      return prev.map((p) => (isNew(p) && map.has(p.id) ? map.get(p.id)! : p));
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function removePhoto(index: number) {
    const photo = photos[index];
    const storagePath = isNew(photo) ? photo.storagePath : photo.storagePath;
    if (storagePath) {
      setRemovedPaths((prev) => [...prev, storagePath]);
    }

    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    setSuccess(false);

    if (coverIndex === index) setCoverIndex(0);
    else if (coverIndex > index) setCoverIndex(coverIndex - 1);
  }

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
      setSuccess(false);

      if (coverIndex === from) setCoverIndex(to);
      else if (from < coverIndex && to >= coverIndex)
        setCoverIndex(coverIndex - 1);
      else if (from > coverIndex && to <= coverIndex)
        setCoverIndex(coverIndex + 1);
    }

    dragItemRef.current = null;
    setDragOverIndex(null);
  }

  async function handleSave() {
    const uploading = photos.some((p) => isNew(p) && p.uploading);
    if (uploading) {
      setError("Espera a que terminen de subir las fotos");
      return;
    }

    // Collect storage paths (filter out failed uploads)
    const paths = photos
      .map((p) => (isNew(p) ? p.storagePath : p.storagePath))
      .filter((p): p is string => p !== null);

    if (paths.length < MIN_PHOTOS) {
      setError(`Necesitas al menos ${MIN_PHOTOS} fotos`);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    // Only include removed paths that are NOT in the final list
    const actuallyRemoved = removedPaths.filter((rp) => !paths.includes(rp));

    const result = await updateVehicle({
      vehicleId,
      photoStoragePaths: paths,
      coverPhotoIndex: coverIndex,
      removedPhotoStoragePaths:
        actuallyRemoved.length > 0 ? actuallyRemoved : undefined,
    });

    if (result.success) {
      setSuccess(true);
      setRemovedPaths([]);
    } else {
      setError(result.error || "Error al guardar");
    }
    setSaving(false);
  }

  function getPreviewUrl(photo: EditablePhoto): string {
    return photo.previewUrl;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Mínimo {MIN_PHOTOS} fotos, máximo {MAX_PHOTOS}. Arrastra para
        reordenar. {photos.length}/{MAX_PHOTOS} fotos.
      </p>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Upload zones */}
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
            JPG, PNG o WebP
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
          <p className="text-sm font-medium text-foreground">Tomar foto</p>
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
          {photos.map((photo, index) => {
            const isUploading = isNew(photo) && photo.uploading;
            const isFailed = isNew(photo) && !photo.uploading && !photo.storagePath;

            return (
              <div
                key={isNew(photo) ? photo.id : photo.mediaId}
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
                } ${isUploading ? "opacity-60" : ""}`}
              >
                <img
                  src={getPreviewUrl(photo)}
                  alt={`Foto ${index + 1}`}
                  className="size-full object-cover"
                />

                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="size-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}

                {isFailed && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
                    <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      ERROR
                    </span>
                  </div>
                )}

                {coverIndex === index && (
                  <div className="absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                    PORTADA
                  </div>
                )}

                <div className="absolute inset-0 flex items-start justify-end gap-1 bg-black/0 p-1 opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCoverIndex(index);
                      setSuccess(false);
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

                <div className="absolute bottom-1 left-1 rounded bg-black/50 p-0.5 text-white opacity-0 group-hover:opacity-100">
                  <GripVertical className="size-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback + Save */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
          <CheckCircle2 className="size-4 text-accent" />
          <p className="text-sm font-medium text-accent">Fotos actualizadas</p>
        </div>
      )}

      <Button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {saving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        Guardar fotos
      </Button>
    </div>
  );
}
