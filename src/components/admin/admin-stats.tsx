import Link from "next/link";
import {
  Car,
  Users,
  DollarSign,
  QrCode,
  TrendingUp,
  Eye,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PUBLICATION_PRICE_USD } from "@/lib/constants";
import type { Vehicle } from "@/types";
import changelog from "@/data/changelog.json";

type VehicleRow = Pick<Vehicle, "id" | "brand" | "model" | "year" | "slug" | "views_count" | "status" | "published_at">;

export async function AdminStats() {
  const supabase = await createClient();

  // Parallel queries for performance
  const [
    { count: activeVehicles },
    { count: totalVehicles },
    { count: soldVehicles },
    { count: totalUsers },
    { count: pendingQr },
    { count: completedPayments },
    { data: topVehicles },
    { data: recentVehicles },
  ] = await Promise.all([
    supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("vehicles").select("*", { count: "exact", head: true }),
    supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "sold"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("qr_orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("payments").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase
      .from("vehicles")
      .select("id, brand, model, year, slug, views_count, status, published_at")
      .eq("status", "active")
      .order("views_count", { ascending: false })
      .limit(5),
    supabase
      .from("vehicles")
      .select("id, brand, model, year, slug, views_count, status, published_at")
      .order("published_at", { ascending: false })
      .limit(30),
  ]);

  const totalRevenue = (completedPayments || 0) * PUBLICATION_PRICE_USD;
  const conversionRate =
    totalVehicles && totalVehicles > 0
      ? Math.round(((soldVehicles || 0) / totalVehicles) * 100)
      : 0;

  const typedTopVehicles = (topVehicles as VehicleRow[]) || [];
  const typedRecentVehicles = (recentVehicles as VehicleRow[]) || [];

  // Publications per day (last 7 days)
  const now = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  const pubsByDay = last7Days.map((day) => ({
    day: day.slice(5), // MM-DD
    count: typedRecentVehicles.filter(
      (v) => v.published_at && v.published_at.startsWith(day)
    ).length,
  }));

  // Recent changelog entries
  const recentChangelog = changelog[0];

  const stats = [
    {
      label: "Publicaciones activas",
      value: activeVehicles || 0,
      icon: Car,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Usuarios registrados",
      value: totalUsers || 0,
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Ingresos totales",
      value: `$${totalRevenue.toLocaleString("en-US")}`,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "QR pendientes",
      value: pendingQr || 0,
      icon: QrCode,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      label: "Conversión (vendidos)",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      label: "Total publicaciones",
      value: totalVehicles || 0,
      icon: BarChart3,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
  ];

  return (
    <div className="mt-6 space-y-6">
      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${stat.bgColor}`}>
                <stat.icon className={`size-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {typeof stat.value === "number"
                    ? stat.value.toLocaleString()
                    : stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Publications chart (simple bar) */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">
            Publicaciones (últimos 7 días)
          </h3>
          <div className="flex items-end gap-2 h-32">
            {pubsByDay.map((d) => {
              const maxCount = Math.max(...pubsByDay.map((p) => p.count), 1);
              const height = Math.max((d.count / maxCount) * 100, 4);
              return (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-bold text-foreground">
                    {d.count}
                  </span>
                  <div
                    className="w-full rounded-t bg-primary/80 transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 most visited */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">
            Top 5 más visitados
          </h3>
          <div className="space-y-3">
            {typedTopVehicles.map((v, i) => (
              <Link
                key={v.id}
                href={`/${v.slug}`}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {v.brand} {v.model} {v.year}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="size-3" />
                  {v.views_count}
                </div>
              </Link>
            ))}
            {typedTopVehicles.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin vehículos aún</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent changelog */}
      {recentChangelog && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-accent" />
              Últimas actualizaciones
            </h3>
            <Link
              href="/admin/changelog"
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver todo
            </Link>
          </div>
          <div className="space-y-3">
            {recentChangelog.entries.slice(0, 3).map((entry) => (
              <div key={entry.title} className="flex gap-3">
                <span className="mt-0.5 text-sm">
                  {entry.type === "feature"
                    ? "🆕"
                    : entry.type === "improvement"
                    ? "🔧"
                    : entry.type === "fix"
                    ? "🐛"
                    : "🔒"}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {entry.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {entry.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
