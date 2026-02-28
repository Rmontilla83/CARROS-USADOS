import Link from "next/link";
import { Eye, ExternalLink } from "lucide-react";
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
import { VehicleStatusActions } from "./vehicle-status-actions";
import { QrPreviewButton } from "./qr-preview-button";
import { AdminVehicleFilters } from "./admin-vehicle-filters";
import type { Vehicle, Profile, VehicleStatus } from "@/types";

interface Props {
  statusFilter?: string;
  searchQuery?: string;
}

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
  | "created_at"
  | "user_id"
>;

const STATUS_CONFIG: Record<
  VehicleStatus,
  { label: string; className: string }
> = {
  active: { label: "Activo", className: "bg-accent/15 text-accent border-accent/30" },
  expired: { label: "Vencido", className: "bg-orange-100 text-orange-700 border-orange-300" },
  sold: { label: "Vendido", className: "bg-blue-100 text-blue-700 border-blue-300" },
  draft: { label: "Borrador", className: "bg-gray-100 text-gray-600 border-gray-300" },
  pending_review: { label: "En revisión", className: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  rejected: { label: "Rechazado", className: "bg-red-100 text-red-700 border-red-300" },
};

export async function AdminVehicleTable({ statusFilter, searchQuery }: Props) {
  const supabase = await createClient();

  let query = supabase
    .from("vehicles")
    .select(
      "id, brand, model, year, price, slug, status, views_count, created_at, user_id"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (statusFilter && statusFilter in STATUS_CONFIG) {
    query = query.eq("status", statusFilter);
  }

  if (searchQuery) {
    query = query.or(
      `brand.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%`
    );
  }

  const { data: vehicles } = await query;
  const typedVehicles = (vehicles as VehicleRow[]) || [];

  // Fetch seller names
  const userIds = [...new Set(typedVehicles.map((v) => v.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds)
    : { data: [] };

  const nameMap = new Map<string, string>();
  if (profiles) {
    for (const p of profiles as Pick<Profile, "id" | "full_name">[]) {
      nameMap.set(p.id, p.full_name);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <AdminVehicleFilters
        currentStatus={statusFilter}
        currentQuery={searchQuery}
      />

      {typedVehicles.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No se encontraron publicaciones.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {/* Desktop table */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Visitas</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typedVehicles.map((v) => {
                  const statusCfg = STATUS_CONFIG[v.status];
                  return (
                    <TableRow key={v.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {v.brand} {v.model} {v.year}
                          </span>
                          <Link
                            href={`/${v.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="size-3 text-muted-foreground hover:text-primary" />
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {nameMap.get(v.user_id) || "—"}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        ${v.price.toLocaleString("en-US")}
                      </TableCell>
                      <TableCell>
                        <Badge className={`border text-[11px] ${statusCfg.className}`}>
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="size-3" />
                          {v.views_count}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(v.created_at).toLocaleDateString("es-VE", {
                          day: "numeric",
                          month: "short",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <QrPreviewButton
                            slug={v.slug}
                            vehicleName={`${v.brand} ${v.model} ${v.year}`}
                          />
                          <VehicleStatusActions
                            vehicleId={v.id}
                            currentStatus={v.status}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-border lg:hidden">
            {typedVehicles.map((v) => {
              const statusCfg = STATUS_CONFIG[v.status];
              return (
                <div key={v.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {v.brand} {v.model} {v.year}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {nameMap.get(v.user_id) || "—"} ·{" "}
                        ${v.price.toLocaleString("en-US")}
                      </p>
                    </div>
                    <Badge className={`shrink-0 border text-[11px] ${statusCfg.className}`}>
                      {statusCfg.label}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="size-3" />
                      {v.views_count} visitas
                    </span>
                    <div className="flex items-center gap-1">
                      <QrPreviewButton
                        slug={v.slug}
                        vehicleName={`${v.brand} ${v.model} ${v.year}`}
                      />
                      <VehicleStatusActions
                        vehicleId={v.id}
                        currentStatus={v.status}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
