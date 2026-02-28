import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PhotoGallery } from "@/components/vehicle/photo-gallery";
import { WhatsAppButton } from "@/components/vehicle/whatsapp-button";
import { ShareButton } from "@/components/vehicle/share-button";
import { ViewTracker } from "@/components/vehicle/view-tracker";
import { createClient } from "@/lib/supabase/server";
import { VEHICLE_CONDITIONS, APP_NAME, APP_URL } from "@/lib/constants";
import type { Vehicle, Media, Profile, AiPriceReport } from "@/types";

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

  // Fetch AI price report
  const { data: aiReport } = await supabase
    .from("ai_price_reports")
    .select("suggested_price, market_price_low, market_price_high, confidence, analysis")
    .eq("vehicle_id", typedVehicle.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  return {
    vehicle: typedVehicle,
    photos,
    video,
    seller: profile as Pick<Profile, "full_name" | "phone" | "city"> | null,
    aiReport: aiReport as Pick<AiPriceReport, "suggested_price" | "market_price_low" | "market_price_high" | "confidence" | "analysis"> | null,
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

  const { vehicle, photos, video, seller, aiReport } = data;

  // Compute dynamic price badge
  let priceBadge: { label: string; className: string } | null = null;
  if (aiReport?.market_price_low != null && aiReport?.market_price_high != null) {
    if (vehicle.price <= aiReport.market_price_low) {
      priceBadge = {
        label: "Buen precio",
        className: "bg-green-100 text-green-700 border-green-300",
      };
    } else if (vehicle.price <= aiReport.market_price_high) {
      priceBadge = {
        label: "Precio justo",
        className: "bg-accent/10 text-accent border-accent/20",
      };
    } else {
      priceBadge = {
        label: "Por encima del mercado",
        className: "bg-orange-100 text-orange-700 border-orange-300",
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
            <div className="mt-2 flex items-center gap-2">
              {priceBadge && (
                <Badge className={`${priceBadge.className} border`}>
                  <TrendingUp className="size-3" />
                  {priceBadge.label}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                <Eye className="inline size-3" /> {vehicle.views_count} visitas
              </span>
            </div>
          </div>

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
