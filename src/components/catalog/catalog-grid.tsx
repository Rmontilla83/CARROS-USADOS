import Link from "next/link";
import { Car, Gauge, Cog, Fuel } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Vehicle, Media } from "@/types";

const PER_PAGE = 12;

const TRANSMISSION_LABELS: Record<string, string> = {
  manual: "Manual",
  automatic: "Automática",
  cvt: "CVT",
};

const FUEL_LABELS: Record<string, string> = {
  gasoline: "Gasolina",
  diesel: "Diésel",
  electric: "Eléctrico",
  hybrid: "Híbrido",
  gas: "Gas",
};

type FeaturedVehicle = Pick<
  Vehicle,
  "id" | "brand" | "model" | "year" | "price" | "slug" | "mileage" | "transmission" | "fuel"
>;

interface CatalogGridProps {
  searchParams: Record<string, string | undefined>;
}

export async function CatalogGrid({ searchParams }: CatalogGridProps) {
  const supabase = await createClient();

  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  // Build query
  let query = supabase
    .from("vehicles")
    .select("id, brand, model, year, price, slug, mileage, transmission, fuel", {
      count: "exact",
    })
    .eq("status", "active");

  // Text search
  if (searchParams.q) {
    const q = `%${searchParams.q}%`;
    query = query.or(`brand.ilike.${q},model.ilike.${q}`);
  }

  // Exact filters
  if (searchParams.brand) query = query.eq("brand", searchParams.brand);
  if (searchParams.transmission) query = query.eq("transmission", searchParams.transmission);
  if (searchParams.fuel) query = query.eq("fuel", searchParams.fuel);

  // Range filters
  if (searchParams.yearMin) query = query.gte("year", parseInt(searchParams.yearMin, 10));
  if (searchParams.yearMax) query = query.lte("year", parseInt(searchParams.yearMax, 10));
  if (searchParams.priceMin) query = query.gte("price", parseFloat(searchParams.priceMin));
  if (searchParams.priceMax) query = query.lte("price", parseFloat(searchParams.priceMax));

  // City filter — requires join with profiles; use a workaround via user lookup
  // For now we skip city filter on the vehicle table directly (would need RPC or view)

  // Sort
  const sort = searchParams.sort || "recent";
  switch (sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "km_asc":
      query = query.order("mileage", { ascending: true, nullsFirst: false });
      break;
    default:
      query = query.order("published_at", { ascending: false });
  }

  // Pagination
  query = query.range(from, to);

  const { data: vehicles, count } = await query;
  const typedVehicles = (vehicles as FeaturedVehicle[]) || [];
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / PER_PAGE);

  // Fetch covers
  let coverMap = new Map<string, string>();
  if (typedVehicles.length > 0) {
    const vehicleIds = typedVehicles.map((v) => v.id);
    const { data: covers } = await supabase
      .from("media")
      .select("vehicle_id, url")
      .in("vehicle_id", vehicleIds)
      .eq("type", "photo")
      .eq("is_cover", true);

    if (covers) {
      for (const c of covers as Pick<Media, "vehicle_id" | "url">[]) {
        coverMap.set(c.vehicle_id, c.url);
      }
    }
  }

  // Build pagination URL helper
  function pageUrl(p: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    if (p > 1) params.set("page", p.toString());
    const qs = params.toString();
    return `/catalogo${qs ? `?${qs}` : ""}`;
  }

  if (typedVehicles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-16 text-center">
        <Car className="mx-auto size-16 text-muted-foreground/20" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          No se encontraron vehículos
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Intenta ajustar los filtros de búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Results count */}
      <p className="mb-4 text-sm text-muted-foreground">
        {totalCount} vehículo{totalCount !== 1 ? "s" : ""} encontrado{totalCount !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {typedVehicles.map((vehicle) => {
          const coverUrl = coverMap.get(vehicle.id);
          return (
            <Link
              key={vehicle.id}
              href={`/${vehicle.slug}`}
              className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
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
                    <Car className="size-16 text-muted-foreground/20" />
                  </div>
                )}
                <div className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm">
                  <p className="text-lg font-extrabold text-foreground">
                    ${vehicle.price.toLocaleString("en-US")}
                  </p>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {vehicle.brand} {vehicle.model} {vehicle.year}
                </h3>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {vehicle.mileage != null && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
                      <Gauge className="size-3" />
                      {vehicle.mileage.toLocaleString()} km
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
                    <Cog className="size-3" />
                    {TRANSMISSION_LABELS[vehicle.transmission]}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
                    <Fuel className="size-3" />
                    {FUEL_LABELS[vehicle.fuel]}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Paginación">
          {page > 1 && (
            <Link
              href={pageUrl(page - 1)}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
            >
              Anterior
            </Link>
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showEllipsis = prev !== undefined && p - prev > 1;
              return (
                <span key={p} className="flex items-center gap-1">
                  {showEllipsis && (
                    <span className="px-2 text-sm text-muted-foreground">...</span>
                  )}
                  <Link
                    href={pageUrl(p)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-primary text-white"
                        : "border border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {p}
                  </Link>
                </span>
              );
            })}

          {page < totalPages && (
            <Link
              href={pageUrl(page + 1)}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
            >
              Siguiente
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
