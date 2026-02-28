import Link from "next/link";
import { Car, Eye, QrCode, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Vehicle } from "@/types";

type VehicleStats = Pick<Vehicle, "id" | "status" | "views_count" | "qr_scans_count">;

export async function DashboardStats() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, status, views_count, qr_scans_count")
    .eq("user_id", user.id);

  const typedVehicles = (vehicles as VehicleStats[]) || [];

  const activeCount = typedVehicles.filter((v) => v.status === "active").length;
  const totalViews = typedVehicles.reduce((sum, v) => sum + v.views_count, 0);
  const totalScans = typedVehicles.reduce(
    (sum, v) => sum + v.qr_scans_count,
    0
  );

  const stats = [
    {
      label: "Vehículos activos",
      value: activeCount,
      icon: Car,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Visitas totales",
      value: totalViews,
      icon: Eye,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Escaneos QR",
      value: totalScans,
      icon: QrCode,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="mt-6 space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card p-5"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${stat.bgColor}`}>
                <stat.icon className={`size-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      {typedVehicles.length > 0 ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Acciones rápidas
            </h2>
            <Link
              href="/dashboard/vehicles"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Ver todos
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Tienes {typedVehicles.length} vehículo
            {typedVehicles.length !== 1 ? "s" : ""} publicado
            {typedVehicles.length !== 1 ? "s" : ""}. Gestiona tus
            publicaciones desde{" "}
            <Link
              href="/dashboard/vehicles"
              className="font-medium text-primary hover:underline"
            >
              Mis Vehículos
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Car className="mx-auto size-10 text-muted-foreground/40" />
          <p className="mt-3 text-muted-foreground">
            Aún no tienes vehículos publicados.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Haz clic en &quot;Publicar Vehículo&quot; para comenzar.
          </p>
        </div>
      )}
    </div>
  );
}
