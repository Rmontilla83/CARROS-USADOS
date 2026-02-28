import { Car, Users, DollarSign, QrCode } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function AdminStats() {
  const supabase = await createClient();

  // Count active vehicles
  const { count: activeVehicles } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Count registered users
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Count pending QR orders
  const { count: pendingQr } = await supabase
    .from("qr_orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Total revenue placeholder (count completed payments * $10)
  const { count: completedPayments } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  const totalRevenue = (completedPayments || 0) * 10;

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
  ];

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
  );
}
