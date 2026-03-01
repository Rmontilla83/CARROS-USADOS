"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  ImageIcon,
  FileText,
  Film,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EditPriceSection } from "@/components/edit/edit-price-section";
import { EditPhotosSection } from "@/components/edit/edit-photos-section";
import { EditDescriptionSection } from "@/components/edit/edit-description-section";
import { EditVideoSection } from "@/components/edit/edit-video-section";
import type { ExistingPhoto } from "@/types/edit-vehicle";

interface VehicleData {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  description: string | null;
  conditions: Record<string, boolean>;
  status: string;
}

interface MediaRecord {
  id: string;
  type: string;
  url: string;
  storage_path: string;
  display_order: number;
  is_cover: boolean;
}

interface AiReport {
  suggested_price: number | null;
  market_price_low: number | null;
  market_price_high: number | null;
  price_market_avg: number | null;
}

type SectionKey = "price" | "photos" | "description" | "video";

const SECTIONS: { key: SectionKey; label: string; icon: React.ElementType }[] = [
  { key: "price", label: "Precio", icon: DollarSign },
  { key: "photos", label: "Fotos", icon: ImageIcon },
  { key: "description", label: "Descripción y Condiciones", icon: FileText },
  { key: "video", label: "Video", icon: Film },
];

export default function EditVehiclePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const vehicleId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [photos, setPhotos] = useState<ExistingPhoto[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoStoragePath, setVideoStoragePath] = useState<string | null>(null);
  const [aiData, setAiData] = useState<AiReport | null>(null);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    price: true,
    photos: false,
    description: false,
    video: false,
  });

  function toggleSection(key: SectionKey) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("No autenticado");
        setLoading(false);
        return;
      }

      // Fetch vehicle
      const { data: v, error: vErr } = await supabase
        .from("vehicles")
        .select("id, brand, model, year, price, description, conditions, status")
        .eq("id", vehicleId)
        .eq("user_id", user.id)
        .single();

      if (vErr || !v) {
        setError("Vehículo no encontrado");
        setLoading(false);
        return;
      }

      const vehicleData = v as VehicleData;

      if (vehicleData.status !== "active" && vehicleData.status !== "expired") {
        setError("Solo puedes editar vehículos activos o vencidos");
        setLoading(false);
        return;
      }

      setVehicle(vehicleData);

      // Fetch media (photos + video)
      const { data: media } = await supabase
        .from("media")
        .select("id, type, url, storage_path, display_order, is_cover")
        .eq("vehicle_id", vehicleId)
        .order("display_order", { ascending: true });

      const mediaRecords = (media || []) as MediaRecord[];

      const photoRecords = mediaRecords
        .filter((m) => m.type === "photo")
        .sort((a, b) => a.display_order - b.display_order);

      const existingPhotos: ExistingPhoto[] = photoRecords.map((m) => ({
        kind: "existing" as const,
        mediaId: m.id,
        previewUrl: m.url,
        storagePath: m.storage_path,
      }));

      setPhotos(existingPhotos);

      const coverIdx = photoRecords.findIndex((m) => m.is_cover);
      setCoverIndex(coverIdx >= 0 ? coverIdx : 0);

      const videoRecord = mediaRecords.find((m) => m.type === "video");
      if (videoRecord) {
        setVideoUrl(videoRecord.url);
        setVideoStoragePath(videoRecord.storage_path);
      }

      // Fetch AI report
      const { data: ai } = await supabase
        .from("ai_price_reports")
        .select("suggested_price, market_price_low, market_price_high, price_market_avg")
        .eq("vehicle_id", vehicleId)
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      if (ai) {
        setAiData(ai as AiReport);
      }

      setLoading(false);
    }

    loadData();
  }, [vehicleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div>
        <Link
          href="/dashboard/vehicles"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Mis Vehículos
        </Link>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{error || "Error desconocido"}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href={`/dashboard/vehicles/${vehicleId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver al detalle
      </Link>

      {/* Header */}
      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <h1 className="text-xl font-bold text-foreground">
          Editar: {vehicle.brand} {vehicle.model} {vehicle.year}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Marca, modelo y año no son editables
        </p>
      </div>

      {/* Collapsible sections */}
      <div className="space-y-3">
        {SECTIONS.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className="overflow-hidden rounded-lg border border-border bg-card"
          >
            <button
              type="button"
              onClick={() => toggleSection(key)}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-secondary/50"
            >
              <div className="flex items-center gap-2">
                <Icon className="size-5 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  {label}
                </span>
              </div>
              {openSections[key] ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>

            {openSections[key] && (
              <div className="border-t border-border p-4">
                {key === "price" && (
                  <EditPriceSection
                    vehicleId={vehicle.id}
                    initialPrice={vehicle.price}
                    aiData={
                      aiData && aiData.market_price_low != null && aiData.market_price_high != null
                        ? {
                            suggestedPrice: aiData.suggested_price ?? aiData.market_price_low,
                            marketPriceLow: aiData.market_price_low,
                            marketPriceHigh: aiData.market_price_high,
                            priceMarketAvg: aiData.price_market_avg,
                          }
                        : null
                    }
                  />
                )}
                {key === "photos" && (
                  <EditPhotosSection
                    vehicleId={vehicle.id}
                    initialPhotos={photos}
                    initialCoverIndex={coverIndex}
                  />
                )}
                {key === "description" && (
                  <EditDescriptionSection
                    vehicleId={vehicle.id}
                    initialDescription={vehicle.description || ""}
                    initialConditions={vehicle.conditions}
                  />
                )}
                {key === "video" && (
                  <EditVideoSection
                    vehicleId={vehicle.id}
                    initialVideoUrl={videoUrl}
                    initialVideoStoragePath={videoStoragePath}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
