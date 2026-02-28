import Link from "next/link";
import { Car, Eye, QrCode, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import type { Vehicle, Media, VehicleStatus } from "@/types";

type VehicleRow = Pick<
  Vehicle,
  | "id"
  | "brand"
  | "model"
  | "year"
  | "price"
  | "slug"
  | "status"
  | "views_count"
  | "qr_scans_count"
  | "created_at"
>;

const STATUS_CONFIG: Record<
  VehicleStatus,
  { label: string; className: string }
> = {
  active: { label: "Activo", className: "bg-accent/15 text-accent border-accent/30" },
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

export async function VehicleCards() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select(
      "id, brand, model, year, price, slug, status, views_count, qr_scans_count, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const typedVehicles = (vehicles as VehicleRow[]) || [];

  if (typedVehicles.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
        <Car className="mx-auto size-10 text-muted-foreground/40" />
        <p className="mt-3 text-muted-foreground">
          Aún no tienes vehículos publicados.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Haz clic en &quot;Publicar&quot; para comenzar.
        </p>
      </div>
    );
  }

  // Fetch cover photos for all vehicles
  const vehicleIds = typedVehicles.map((v) => v.id);
  const { data: covers } = await supabase
    .from("media")
    .select("vehicle_id, url")
    .in("vehicle_id", vehicleIds)
    .eq("type", "photo")
    .eq("is_cover", true);

  const coverMap = new Map<string, string>();
  if (covers) {
    for (const c of covers as Pick<Media, "vehicle_id" | "url">[]) {
      coverMap.set(c.vehicle_id, c.url);
    }
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {typedVehicles.map((vehicle) => {
        const statusConfig = STATUS_CONFIG[vehicle.status];
        const coverUrl = coverMap.get(vehicle.id);

        return (
          <Link
            key={vehicle.id}
            href={`/dashboard/vehicles/${vehicle.id}`}
            className="group overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
          >
            {/* Cover photo */}
            <div className="relative aspect-[4/3] bg-secondary">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
                  loading="lazy"
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <Car className="size-12 text-muted-foreground/30" />
                </div>
              )}
              <Badge
                className={`absolute right-2 top-2 border text-[11px] ${statusConfig.className}`}
              >
                {statusConfig.label}
              </Badge>
            </div>

            {/* Info */}
            <div className="p-3">
              <h3 className="truncate font-semibold text-foreground group-hover:text-primary">
                {vehicle.brand} {vehicle.model} {vehicle.year}
              </h3>
              <p className="mt-0.5 text-lg font-bold text-foreground">
                ${vehicle.price.toLocaleString("en-US")}
              </p>

              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Eye className="size-3.5" />
                  {vehicle.views_count}
                </span>
                <span className="inline-flex items-center gap-1">
                  <QrCode className="size-3.5" />
                  {vehicle.qr_scans_count}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
