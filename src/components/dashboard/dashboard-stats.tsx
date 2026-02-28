import Link from "next/link";
import { Car, Eye, QrCode, ArrowRight, Plus } from "lucide-react";
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
      borderColor: "border-primary/20",
    },
    {
      label: "Visitas totales",
      value: totalViews,
      icon: Eye,
      color: "text-accent",
      bgColor: "bg-accent/10",
      borderColor: "border-accent/20",
    },
    {
      label: "Escaneos QR",
      value: totalScans,
      icon: QrCode,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
  ];

  return (
    <div className="mt-6 space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${stat.borderColor}`}
          >
            <div className="flex items-center gap-4">
              <div className={`rounded-xl p-3 ${stat.bgColor}`}>
                <stat.icon className={`size-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-foreground">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      {typedVehicles.length > 0 ? (
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground">
              Acciones rápidas
            </h2>
            <Link
              href="/dashboard/vehicles"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Ver todos
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
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
        <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Car className="size-8 text-primary/40" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-foreground">
            Publica tu primer vehículo
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Haz clic abajo para comenzar tu primera publicación.
          </p>
          <Link
            href="/dashboard/publish"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 hover:bg-accent/90"
          >
            <Plus className="size-4" />
            Publicar Vehículo
          </Link>
        </div>
      )}
    </div>
  );
}
