import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  QrCode,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { VinylDownloadCard } from "@/components/vehicle/vinyl-download-card";
import { MarkAsSoldButton } from "@/components/dashboard/mark-as-sold-button";
import { RenewButton } from "@/components/dashboard/renew-button";
import { FeedbackSummary } from "@/components/dashboard/feedback-summary";
import type { Vehicle, Media, QrOrder, VehicleStatus } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_CONFIG: Record<
  VehicleStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Activo",
    className: "bg-accent/15 text-accent border-accent/30",
  },
  expired: {
    label: "Vencido",
    className: "bg-orange-100 text-orange-700 border-orange-300",
  },
  sold: {
    label: "Vendido",
    className: "bg-blue-100 text-blue-700 border-blue-300",
  },
  draft: {
    label: "Borrador",
    className: "bg-gray-100 text-gray-600 border-gray-300",
  },
  pending_review: {
    label: "En revisión",
    className: "bg-yellow-100 text-yellow-700 border-yellow-300",
  },
  rejected: {
    label: "Rechazado",
    className: "bg-red-100 text-red-700 border-red-300",
  },
};

export default async function VehicleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  // Fetch vehicle
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) notFound();

  const v = vehicle as Vehicle;
  const statusConfig = STATUS_CONFIG[v.status];

  // Fetch cover photo
  const { data: coverMedia } = await supabase
    .from("media")
    .select("url")
    .eq("vehicle_id", v.id)
    .eq("type", "photo")
    .eq("is_cover", true)
    .single();

  const coverUrl = (coverMedia as Pick<Media, "url"> | null)?.url;

  // Fetch QR order
  const { data: qrOrder } = await supabase
    .from("qr_orders")
    .select("qr_image_url")
    .eq("vehicle_id", v.id)
    .single();

  const vinylUrl =
    (qrOrder as Pick<QrOrder, "qr_image_url"> | null)?.qr_image_url ?? null;

  // Fetch feedback summary
  const { data: feedback } = await supabase
    .from("feedback")
    .select("price_opinion, comment, created_at")
    .eq("vehicle_id", v.id)
    .order("created_at", { ascending: false });

  const publishedDate = v.published_at
    ? new Date(v.published_at).toLocaleDateString("es-VE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const expiresDate = v.expires_at
    ? new Date(v.expires_at).toLocaleDateString("es-VE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div>
      {/* Back button */}
      <Link
        href="/dashboard/vehicles"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Mis Vehículos
      </Link>

      {/* Header with cover */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
          {/* Cover thumbnail */}
          <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-secondary sm:w-48">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt={`${v.brand} ${v.model} ${v.year}`}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <span className="text-4xl text-muted-foreground/30">🚗</span>
              </div>
            )}
          </div>

          {/* Vehicle info */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                  {v.brand} {v.model} {v.year}
                </h1>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  ${v.price.toLocaleString("en-US")}
                </p>
              </div>
              <Badge className={`shrink-0 border ${statusConfig.className}`}>
                {statusConfig.label}
              </Badge>
            </div>

            {/* Dates */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {publishedDate && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3" />
                  Publicado: {publishedDate}
                </span>
              )}
              {expiresDate && v.status === "active" && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3" />
                  Vence: {expiresDate}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/${v.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <ExternalLink className="size-3.5" />
                Ver tarjeta pública
              </Link>
              {v.status === "active" && (
                <MarkAsSoldButton vehicleId={v.id} />
              )}
              {(v.status === "expired" || (v.status === "active" && v.expires_at &&
                Math.ceil((new Date(v.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 7)) && (
                <RenewButton vehicleId={v.id} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-primary" />
            <span className="text-sm text-muted-foreground">Visitas</span>
          </div>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {v.views_count.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <QrCode className="size-4 text-orange-600" />
            <span className="text-sm text-muted-foreground">Escaneos QR</span>
          </div>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {v.qr_scans_count.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-accent" />
            <span className="text-sm text-muted-foreground">Opiniones</span>
          </div>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {(feedback?.length || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* QR / Vinyl section */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Vinil QR
          </h2>
          <VinylDownloadCard
            vehicleId={v.id}
            brand={v.brand}
            model={v.model}
            year={v.year}
            slug={v.slug}
            existingVinylUrl={vinylUrl}
          />
        </div>

        {/* Feedback section */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Opiniones sobre el precio
          </h2>
          <FeedbackSummary
            feedback={
              (feedback as {
                price_opinion: string;
                comment: string | null;
                created_at: string;
              }[]) || []
            }
          />
        </div>
      </div>
    </div>
  );
}
