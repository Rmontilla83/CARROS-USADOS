import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { QrOrderActions } from "./qr-order-actions";
import type { QrOrder, Vehicle, Profile, QrOrderStatus } from "@/types";

type OrderRow = Pick<
  QrOrder,
  | "id"
  | "vehicle_id"
  | "status"
  | "delivery_address"
  | "delivery_city"
  | "courier_id"
  | "created_at"
>;

const STATUS_CONFIG: Record<QrOrderStatus, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  printing: { label: "Imprimiendo", className: "bg-blue-100 text-blue-700 border-blue-300" },
  printed: { label: "Impreso", className: "bg-purple-100 text-purple-700 border-purple-300" },
  assigned: { label: "Asignado", className: "bg-orange-100 text-orange-700 border-orange-300" },
  delivered: { label: "Entregado", className: "bg-accent/15 text-accent border-accent/30" },
};

export async function QrOrderTable() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("qr_orders")
    .select(
      "id, vehicle_id, status, delivery_address, delivery_city, courier_id, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const typedOrders = (orders as OrderRow[]) || [];

  if (typedOrders.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No hay órdenes de QR.</p>
      </div>
    );
  }

  // Fetch vehicle info
  const vehicleIds = [...new Set(typedOrders.map((o) => o.vehicle_id))];
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, brand, model, year, user_id")
    .in("id", vehicleIds);

  const vehicleMap = new Map<
    string,
    Pick<Vehicle, "brand" | "model" | "year" | "user_id">
  >();
  if (vehicles) {
    for (const v of vehicles as Pick<Vehicle, "id" | "brand" | "model" | "year" | "user_id">[]) {
      vehicleMap.set(v.id, v);
    }
  }

  // Fetch seller names
  const userIds = [
    ...new Set(
      (vehicles as Pick<Vehicle, "user_id">[] || []).map((v) => v.user_id)
    ),
  ];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("id, full_name, city").in("id", userIds)
    : { data: [] };

  const profileMap = new Map<string, Pick<Profile, "full_name" | "city">>();
  if (profiles) {
    for (const p of profiles as Pick<Profile, "id" | "full_name" | "city">[]) {
      profileMap.set(p.id, p);
    }
  }

  // Fetch couriers for the selector
  const { data: couriers } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "courier");

  const courierList = (couriers as Pick<Profile, "id" | "full_name">[]) || [];

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
      {/* Desktop table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehículo</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typedOrders.map((order) => {
              const vehicle = vehicleMap.get(order.vehicle_id);
              const seller = vehicle
                ? profileMap.get(vehicle.user_id)
                : null;
              const statusCfg = STATUS_CONFIG[order.status];

              return (
                <TableRow key={order.id}>
                  <TableCell className="text-sm font-medium">
                    {vehicle
                      ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {seller?.full_name || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {order.delivery_city ||
                      seller?.city ||
                      "Sin dirección"}
                  </TableCell>
                  <TableCell>
                    <Badge className={`border text-[11px] ${statusCfg.className}`}>
                      {statusCfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("es-VE", {
                      day: "numeric",
                      month: "short",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <QrOrderActions
                      orderId={order.id}
                      currentStatus={order.status}
                      couriers={courierList}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-border lg:hidden">
        {typedOrders.map((order) => {
          const vehicle = vehicleMap.get(order.vehicle_id);
          const seller = vehicle ? profileMap.get(vehicle.user_id) : null;
          const statusCfg = STATUS_CONFIG[order.status];

          return (
            <div key={order.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {vehicle
                      ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}`
                      : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {seller?.full_name || "—"} ·{" "}
                    {order.delivery_city || seller?.city || "Sin dirección"}
                  </p>
                </div>
                <Badge className={`shrink-0 border text-[11px] ${statusCfg.className}`}>
                  {statusCfg.label}
                </Badge>
              </div>
              <div className="mt-2">
                <QrOrderActions
                  orderId={order.id}
                  currentStatus={order.status}
                  couriers={courierList}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
