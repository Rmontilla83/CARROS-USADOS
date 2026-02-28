import Link from "next/link";
import { Car, Eye, QrCode, Clock } from "lucide-react";
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
  | "expires_at"
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
      "id, brand, model, year, price, slug, status, views_count, qr_scans_count, created_at, expires_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const typedVehicles = (vehicles as VehicleRow[]) || [];

  if (typedVehicles.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-border bg-white p-10 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Car className="size-8 text-primary/40" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-foreground">
          Sin vehículos aún
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
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
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {typedVehicles.map((vehicle) => {
        const statusConfig = STATUS_CONFIG[vehicle.status];
        const coverUrl = coverMap.get(vehicle.id);

        // Calculate days until expiration
        let daysUntilExpiry: number | null = null;
        if (vehicle.expires_at && vehicle.status === "active") {
          daysUntilExpiry = Math.ceil(
            (new Date(vehicle.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
        }

        return (
          <Link
            key={vehicle.id}
            href={`/dashboard/vehicles/${vehicle.id}`}
            className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            {/* Cover photo */}
            <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <Car className="size-12 text-muted-foreground/20" />
                </div>
              )}
              <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
                <Badge
                  className={`border text-[11px] font-semibold shadow-sm ${statusConfig.className}`}
                >
                  {statusConfig.label}
                </Badge>
                {daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
                  <Badge className="border border-yellow-300 bg-yellow-100 text-[11px] font-semibold text-yellow-700 shadow-sm">
                    <Clock className="mr-1 size-3" />
                    Vence en {daysUntilExpiry}d
                  </Badge>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="truncate text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                {vehicle.brand} {vehicle.model} {vehicle.year}
              </h3>
              <p className="mt-1 text-xl font-extrabold text-accent">
                ${vehicle.price.toLocaleString("en-US")}
              </p>

              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="size-3.5" />
                  {vehicle.views_count} visitas
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <QrCode className="size-3.5" />
                  {vehicle.qr_scans_count} escaneos
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
