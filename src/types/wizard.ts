export interface UploadedPhoto {
  id: string;
  file: File;
  previewUrl: string;
  storagePath: string | null; // null = not yet uploaded
  uploading: boolean;
}

export interface UploadedVideo {
  file: File;
  previewUrl: string;
  storagePath: string | null;
  uploading: boolean;
}

export interface DeliveryData {
  address: string;
  city: string;
  phone: string;
  preferredTime: "morning" | "afternoon" | "any";
  notes: string;
}

export interface WizardData {
  // Step 1 - Vehicle data
  brand: string;
  model: string;
  year: number;
  mileage: number;
  color: string;
  transmission: "automatic" | "manual" | "cvt";
  fuel: "gasoline" | "diesel" | "electric" | "hybrid" | "gas";
  plate: string;
  engine: string;
  doors: number;

  // Step 2 - Photos
  photos: UploadedPhoto[];
  coverPhotoIndex: number;

  // Step 3 - Video
  video: UploadedVideo | null;

  // Step 4 - Description
  description: string;
  conditions: Record<string, boolean>;

  // Step 5 - Price
  price: number;

  // Step 6 - Delivery
  delivery: DeliveryData;

  // Terms acceptance
  termsAccepted: boolean;
}

export const initialWizardData: WizardData = {
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  mileage: 0,
  color: "",
  transmission: "manual",
  fuel: "gasoline",
  plate: "",
  engine: "",
  doors: 4,
  photos: [],
  coverPhotoIndex: 0,
  video: null,
  price: 0,
  description: "",
  conditions: {},
  delivery: {
    address: "",
    city: "",
    phone: "",
    preferredTime: "any",
    notes: "",
  },
  termsAccepted: false,
};
