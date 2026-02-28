import { MapPin, Phone, Check } from "lucide-react";
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
import { canPrintQrOrders, canAssignCourier, canMarkDelivered } from "@/lib/permissions";
import type { QrOrder, Vehicle, Profile, QrOrderStatus, UserRole } from "@/types";

interface Props {
  userRole: UserRole;
  userId: string;
}

type OrderRow = Pick<
  QrOrder,
  | "id"
  | "vehicle_id"
  | "status"
  | "delivery_address"
  | "delivery_city"
  | "delivery_phone"
  | "preferred_time"
  | "delivery_notes"
  | "courier_id"
  | "created_at"
>;

const STATUS_CONFIG: Record<QrOrderStatus, { label: string; className: string; step: number }> = {
  pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700 border-yellow-300", step: 0 },
  printing: { label: "Imprimiendo", className: "bg-blue-100 text-blue-700 border-blue-300", step: 1 },
  printed: { label: "Impreso", className: "bg-purple-100 text-purple-700 border-purple-300", step: 2 },
  assigned: { label: "Asignado", className: "bg-orange-100 text-orange-700 border-orange-300", step: 3 },
  delivered: { label: "Entregado", className: "bg-accent/15 text-accent border-accent/30", step: 4 },
};

const TIME_LABELS: Record<string, string> = {
  morning: "Mañana",
  afternoon: "Tarde",
  any: "Cualquier hora",
};

function StatusTimeline({ status }: { status: QrOrderStatus }) {
  const currentStep = STATUS_CONFIG[status].step;
  const steps = ["Pendiente", "Imprimiendo", "Impreso", "Asignado", "Entregado"];

  return (
    <div className="flex items-center gap-1">
      {steps.map((stepLabel, i) => (
        <div key={stepLabel} className="flex items-center">
          <div
            className={`size-2 rounded-full ${
              i <= currentStep ? "bg-accent" : "bg-border"
            }`}
            title={stepLabel}
          />
          {i < steps.length - 1 && (
            <div
              className={`h-0.5 w-3 ${
                i < currentStep ? "bg-accent" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export async function QrOrderTable({ userRole, userId }: Props) {
  const supabase = await createClient();
  const isCourier = userRole === "courier";
  const showPrintActions = canPrintQrOrders(userRole);
  const showAssignActions = canAssignCourier(userRole);
  const showDeliverActions = canMarkDelivered(userRole);

  let query = supabase
    .from("qr_orders")
    .select(
      "id, vehicle_id, status, delivery_address, delivery_city, delivery_phone, preferred_time, delivery_notes, courier_id, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  // Courier sees only their assigned orders
  if (isCourier) {
    query = query.eq("courier_id", userId);
  }

  const { data: orders } = await query;
  const typedOrders = (orders as OrderRow[]) || [];

  if (typedOrders.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          {isCourier ? "No tienes órdenes asignadas." : "No hay órdenes de QR."}
        </p>
      </div>
    );
  }

  // Stats — different for courier vs printer/admin
  const pendingCount = isCourier
    ? typedOrders.filter((o) => o.status === "assigned").length
    : typedOrders.filter((o) => o.status === "pending").length;
  const inProgressCount = isCourier
    ? typedOrders.filter((o) => {
        const today = new Date().toDateString();
        return o.status === "assigned" && new Date(o.created_at).toDateString() === today;
      }).length
    : typedOrders.filter((o) => o.status === "printed" || o.status === "assigned").length;
  const deliveredCount = typedOrders.filter((o) => o.status === "delivered").length;

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
  const sellerIds = [
    ...new Set(
      (vehicles as Pick<Vehicle, "user_id">[] || []).map((v) => v.user_id)
    ),
  ];
  const { data: profiles } = sellerIds.length > 0
    ? await supabase.from("profiles").select("id, full_name, phone, city").in("id", sellerIds)
    : { data: [] };

  const profileMap = new Map<string, Pick<Profile, "full_name" | "phone" | "city">>();
  if (profiles) {
    for (const p of profiles as Pick<Profile, "id" | "full_name" | "phone" | "city">[]) {
      profileMap.set(p.id, p);
    }
  }

  // Fetch couriers for the selector (only if user can assign)
  let courierList: Pick<Profile, "id" | "full_name">[] = [];
  if (showAssignActions) {
    const { data: couriers } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "courier");
    courierList = (couriers as Pick<Profile, "id" | "full_name">[]) || [];
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Order stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        {isCourier ? (
          <>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-center">
              <p className="text-2xl font-bold text-orange-700">{pendingCount}</p>
              <p className="text-xs text-orange-600">Pendientes de entrega</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{inProgressCount}</p>
              <p className="text-xs text-blue-600">De hoy</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{deliveredCount}</p>
              <p className="text-xs text-green-600">Entregados</p>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
              <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
              <p className="text-xs text-yellow-600">Pendientes</p>
            </div>
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">{inProgressCount}</p>
              <p className="text-xs text-purple-600">Listos para entregar</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{deliveredCount}</p>
              <p className="text-xs text-green-600">Entregados</p>
            </div>
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {/* Desktop table */}
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehículo</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Entrega</TableHead>
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
                const phone = order.delivery_phone || seller?.phone;
                const address = order.delivery_address;

                return (
                  <TableRow key={order.id}>
                    <TableCell className="text-sm font-medium">
                      {vehicle
                        ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div>{seller?.full_name || "—"}</div>
                      <div className="text-xs">{phone || ""}</div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="text-sm text-muted-foreground truncate">
                        {address || "Sin dirección"}
                      </div>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>{order.delivery_city || seller?.city || "—"}</span>
                        {order.preferred_time && (
                          <span>· {TIME_LABELS[String(order.preferred_time)] || String(order.preferred_time)}</span>
                        )}
                      </div>
                      {/* Courier quick actions: map + call */}
                      {isCourier && order.status === "assigned" && (
                        <div className="mt-1 flex gap-2">
                          {address && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ", " + (order.delivery_city || ""))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <MapPin className="size-3" />
                              Ver en mapa
                            </a>
                          )}
                          {phone && (
                            <a
                              href={`tel:${phone}`}
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Phone className="size-3" />
                              Llamar
                            </a>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <Badge className={`border text-[11px] ${statusCfg.className}`}>
                          {statusCfg.label}
                        </Badge>
                        <StatusTimeline status={order.status} />
                      </div>
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
                        userRole={userRole}
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
            const phone = order.delivery_phone || seller?.phone;
            const address = order.delivery_address;

            return (
              <div key={order.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {vehicle
                        ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}`
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {seller?.full_name || "—"}
                    </p>
                  </div>
                  <Badge className={`shrink-0 border text-[11px] ${statusCfg.className}`}>
                    {statusCfg.label}
                  </Badge>
                </div>
                {(address || order.delivery_city) && (
                  <div className="rounded-lg bg-secondary/50 p-2 text-xs text-muted-foreground">
                    <p>{address}</p>
                    <p>{order.delivery_city} · {phone} · {TIME_LABELS[String(order.preferred_time || "any")]}</p>
                    {order.delivery_notes ? (
                      <p className="mt-1 italic">{String(order.delivery_notes)}</p>
                    ) : null}
                  </div>
                )}
                {/* Courier quick actions on mobile */}
                {isCourier && order.status === "assigned" && (
                  <div className="flex gap-3">
                    {address && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ", " + (order.delivery_city || ""))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                      >
                        <MapPin className="size-3" />
                        Ver en mapa
                      </a>
                    )}
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                      >
                        <Phone className="size-3" />
                        Llamar
                      </a>
                    )}
                  </div>
                )}
                <StatusTimeline status={order.status} />
                <QrOrderActions
                  orderId={order.id}
                  currentStatus={order.status}
                  couriers={courierList}
                  userRole={userRole}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
