/** Photo already stored in DB with a media record */
export interface ExistingPhoto {
  kind: "existing";
  mediaId: string;
  previewUrl: string; // public URL
  storagePath: string;
}

/** Newly added photo not yet persisted */
export interface NewPhoto {
  kind: "new";
  id: string; // client-generated
  file: File;
  previewUrl: string; // blob URL
  storagePath: string | null; // null until uploaded
  uploading: boolean;
}

export type EditablePhoto = ExistingPhoto | NewPhoto;

export function isNewPhoto(photo: EditablePhoto): photo is NewPhoto {
  return photo.kind === "new";
}

export function isExistingPhoto(photo: EditablePhoto): photo is ExistingPhoto {
  return photo.kind === "existing";
}
