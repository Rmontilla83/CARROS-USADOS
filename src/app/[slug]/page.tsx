import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import {
  Car,
  Calendar,
  Gauge,
  Palette,
  Cog,
  Fuel,
  DoorOpen,
  Settings,
  CheckCircle2,
  TrendingUp,
  Eye,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PhotoGallery } from "@/components/vehicle/photo-gallery";
import { WhatsAppButton } from "@/components/vehicle/whatsapp-button";
import { ShareButton } from "@/components/vehicle/share-button";
import { ViewTracker } from "@/components/vehicle/view-tracker";
import { PriceAnalysisCard } from "@/components/vehicle/price-analysis-card";
import { TrustBadges } from "@/components/vehicle/trust-badges";
import { computeTrustBadges } from "@/lib/trust-badges";
import { createClient } from "@/lib/supabase/server";
import { VEHICLE_CONDITIONS, APP_NAME, APP_URL } from "@/lib/constants";
import type { Vehicle, Media, Profile } from "@/types";

import { SimilarVehicles } from "@/components/vehicle/similar-vehicles";

// Lazy load below-the-fold components
const FeedbackForm = dynamic(
  () => import("@/components/vehicle/feedback-form").then((m) => ({ default: m.FeedbackForm })),
  { loading: () => <div className="h-32 animate-pulse rounded-lg bg-secondary" /> }
);

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

// ISR: revalidate every hour
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Pre-generate most visited vehicle cards
export async function generateStaticParams() {
  // Use admin client since generateStaticParams runs outside request context
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return [];

  const { createClient: createAdminClient } = await import("@supabase/supabase-js");
  const supabase = createAdminClient(supabaseUrl, supabaseKey);

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("slug")
    .eq("status", "active")
    .order("views_count", { ascending: false })
    .limit(20);

  return (vehicles || []).map((v: { slug: string }) => ({ slug: v.slug }));
}

async function getVehicle(slug: string) {
  const supabase = await createClient();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!vehicle) return null;

  const typedVehicle = vehicle as Vehicle;

  const { data: media } = await supabase
    .from("media")
    .select("*")
    .eq("vehicle_id", typedVehicle.id)
    .order("display_order", { ascending: true });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, city")
    .eq("id", typedVehicle.user_id)
    .single();

  const photos = ((media as Media[]) || []).filter((m) => m.type === "photo");
  const video = ((media as Media[]) || []).find((m) => m.type === "video") || null;

  photos.sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return a.display_order - b.display_order;
  });

  // Fetch AI price report (with new fields)
  const { data: aiReport } = await supabase
    .from("ai_price_reports")
    .select("suggested_price, market_price_low, market_price_high, price_market_avg, confidence, analysis, factors_up, factors_down, market_summary")
    .eq("vehicle_id", typedVehicle.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch seller verification status for trust badges
  const { data: sellerProfile } = await supabase
    .from("profiles")
    .select("is_verified")
    .eq("id", typedVehicle.user_id)
    .single();

  // Latest photo date for trust badges
  const latestPhotoDate = photos.length > 0
    ? photos.reduce((latest, p) => p.created_at > latest ? p.created_at : latest, photos[0].created_at)
    : null;

  const typedAiReport = aiReport as {
    suggested_price: number | null;
    market_price_low: number | null;
    market_price_high: number | null;
    price_market_avg: number | null;
    confidence: number | null;
    analysis: string | null;
    factors_up: string[] | null;
    factors_down: string[] | null;
    market_summary: string | null;
  } | null;

  // Compute trust badges
  const trustBadges = computeTrustBadges({
    vehicle: typedVehicle,
    latestPhotoDate,
    aiMarketAvg: typedAiReport?.price_market_avg ?? null,
    sellerVerified: (sellerProfile as { is_verified: boolean } | null)?.is_verified ?? false,
  });

  return {
    vehicle: typedVehicle,
    photos,
    video,
    seller: profile as Pick<Profile, "full_name" | "phone" | "city"> | null,
    aiReport: typedAiReport,
    trustBadges,
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getVehicle(slug);
  if (!data) return { title: "Vehículo no encontrado" };

  const { vehicle, photos } = data;
  const title = `${vehicle.brand} ${vehicle.model} ${vehicle.year} — $${vehicle.price.toLocaleString()}`;
  const description = `${vehicle.brand} ${vehicle.model} ${vehicle.year}, ${vehicle.mileage?.toLocaleString() || "N/A"} km, ${TRANSMISSION_LABELS[vehicle.transmission]}, ${FUEL_LABELS[vehicle.fuel]}. ${vehicle.color || ""}. Venta en Venezuela.`;
  const coverUrl = photos[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${APP_URL}/${slug}`,
      images: coverUrl ? [{ url: coverUrl, width: 1200, height: 900 }] : [],
      siteName: APP_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: coverUrl ? [coverUrl] : [],
    },
  };
}

export default async function VehicleCardPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getVehicle(slug);
  if (!data) notFound();

  const { vehicle, photos, video, seller, aiReport, trustBadges } = data;

  // Compute dynamic price badge (semaphore)
  let priceBadge: { label: string; emoji: string; className: string } | null = null;
  if (aiReport?.market_price_low != null && aiReport?.market_price_high != null) {
    const avg = aiReport.price_market_avg ?? (aiReport.market_price_low + aiReport.market_price_high) / 2;
    if (vehicle.price <= avg * 0.9) {
      priceBadge = {
        label: "Buen precio",
        emoji: "🟢",
        className: "bg-green-100 text-green-700 border-green-300",
      };
    } else if (vehicle.price <= avg * 1.1) {
      priceBadge = {
        label: "Precio justo",
        emoji: "🔵",
        className: "bg-blue-100 text-blue-700 border-blue-300",
      };
    } else {
      priceBadge = {
        label: "Por encima del mercado",
        emoji: "🟡",
        className: "bg-yellow-100 text-yellow-700 border-yellow-300",
      };
    }
  }

  const activeConditions = VEHICLE_CONDITIONS.filter(
    (c) => vehicle.conditions && vehicle.conditions[c.key]
  );

  const specs = [
    { icon: Calendar, label: "Año", value: vehicle.year.toString() },
    {
      icon: Gauge,
      label: "Kilometraje",
      value: vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : "N/A",
    },
    {
      icon: Cog,
      label: "Transmisión",
      value: TRANSMISSION_LABELS[vehicle.transmission],
    },
    { icon: Fuel, label: "Combustible", value: FUEL_LABELS[vehicle.fuel] },
    { icon: Palette, label: "Color", value: vehicle.color || "N/A" },
    { icon: DoorOpen, label: "Puertas", value: vehicle.doors.toString() },
  ];

  if (vehicle.engine) {
    specs.push({ icon: Settings, label: "Motor", value: vehicle.engine });
  }

  return (
    <div className="min-h-screen bg-background">
      <ViewTracker vehicleId={vehicle.id} />

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-primary"
          >
            <div className="rounded-md bg-primary p-1">
              <Car className="size-3.5 text-white" />
            </div>
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-2">
            <ShareButton
              title={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
              url={`${APP_URL}/${slug}`}
            />
            <Link
              href="/catalogo"
              className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver más carros
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg">
        {/* Photo Gallery */}
        <PhotoGallery photos={photos} />

        <div className="space-y-6 p-4">
          {/* Title + Price block */}
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-extrabold text-foreground">
              {vehicle.brand} {vehicle.model} {vehicle.year}
            </h1>
            {seller?.city && (
              <p className="mt-1 text-sm text-muted-foreground">
                {seller.city}, Anzoátegui
              </p>
            )}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-4xl font-extrabold text-accent">
                ${vehicle.price.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {priceBadge && (
                <Badge className={`${priceBadge.className} border`}>
                  <span className="mr-0.5">{priceBadge.emoji}</span>
                  {priceBadge.label}
                </Badge>
              )}
              {aiReport && (
                <Badge className="border border-accent/20 bg-accent/5 text-accent text-[10px]">
                  <Sparkles className="size-2.5 mr-0.5" />
                  Precio analizado por IA
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                <Eye className="inline size-3" /> {vehicle.views_count} visitas
              </span>
            </div>
            {trustBadges.length > 0 && (
              <div className="mt-3 border-t border-border pt-3">
                <TrustBadges badges={trustBadges} />
              </div>
            )}
          </div>

          {/* AI Price analysis section */}
          {aiReport?.market_price_low != null && aiReport?.market_price_high != null && (
            <PriceAnalysisCard
              price={vehicle.price}
              min={aiReport.market_price_low}
              max={aiReport.market_price_high}
              avg={aiReport.price_market_avg ?? undefined}
              factorsUp={aiReport.factors_up ?? undefined}
              factorsDown={aiReport.factors_down ?? undefined}
              summary={aiReport.market_summary ?? undefined}
            />
          )}

          {/* WhatsApp CTA */}
          {seller?.phone && (
            <WhatsAppButton
              phone={seller.phone}
              brand={vehicle.brand}
              model={vehicle.model}
              year={vehicle.year}
            />
          )}

          {/* Specifications grid */}
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Especificaciones
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3"
                >
                  <div className="rounded-lg bg-primary/10 p-2">
                    <spec.icon className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {spec.label}
                    </p>
                    <p className="truncate text-sm font-bold text-foreground">
                      {spec.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conditions */}
          {activeConditions.length > 0 && (
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Condiciones
              </h2>
              <div className="flex flex-wrap gap-2">
                {activeConditions.map((c) => (
                  <span
                    key={c.key}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent"
                  >
                    <CheckCircle2 className="size-3.5" />
                    {c.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {vehicle.description && (
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Descripción
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                {vehicle.description}
              </p>
            </div>
          )}

          {/* Video */}
          {video && (
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Video
              </h2>
              <video
                src={video.url}
                controls
                preload="metadata"
                className="w-full rounded-xl bg-black"
                aria-label={`Video del ${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
              />
            </div>
          )}

          {/* Similar vehicles + AI comparison */}
          <Suspense
            fallback={
              <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
            }
          >
            <SimilarVehicles vehicle={vehicle} />
          </Suspense>

          {/* Security banner */}
          <Link
            href="/seguridad"
            className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100"
          >
            <span className="text-lg">⚠️</span>
            <span className="text-sm font-medium text-amber-800">
              Recomendaciones de seguridad para tu compra
            </span>
          </Link>

          {/* Feedback */}
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <FeedbackForm vehicleId={vehicle.id} />
          </div>

          {/* Back to catalog + footer */}
          <div className="space-y-4 pb-24 pt-4">
            <Link
              href="/catalogo"
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Ver más vehículos disponibles
            </Link>
            <p className="text-center text-xs text-muted-foreground">
              Publicado en{" "}
              <Link href="/" className="font-medium text-primary hover:underline">
                {APP_NAME}
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Floating WhatsApp button (mobile) */}
      {seller?.phone && (
        <div className="fixed bottom-4 left-4 right-4 z-50 sm:hidden">
          <WhatsAppButton
            phone={seller.phone}
            brand={vehicle.brand}
            model={vehicle.model}
            year={vehicle.year}
          />
        </div>
      )}
    </div>
  );
}
