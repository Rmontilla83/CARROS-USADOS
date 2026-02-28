import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { CatalogSort } from "@/components/catalog/catalog-sort";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Catálogo de Vehículos Usados | CarrosUsados",
  description:
    "Encuentra tu próximo vehículo usado en Venezuela. Filtra por marca, precio, año, transmisión y más. Vehículos verificados con QR inteligente.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

function GridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border bg-white">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function CatalogoPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 pt-20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
              Vehículos disponibles
            </h1>
            <p className="mt-2 text-muted-foreground">
              Encuentra tu próximo carro en Venezuela
            </p>
          </div>

          <div className="flex gap-8">
            {/* Filters sidebar (desktop) + mobile trigger */}
            <Suspense fallback={null}>
              <CatalogFilters />
            </Suspense>

            {/* Main content */}
            <div className="min-w-0 flex-1">
              {/* Sort bar */}
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="lg:hidden">
                  {/* Mobile filter button rendered inside CatalogFilters */}
                </div>
                <div className="ml-auto">
                  <Suspense fallback={null}>
                    <CatalogSort />
                  </Suspense>
                </div>
              </div>

              {/* Vehicle grid */}
              <Suspense fallback={<GridSkeleton />}>
                <CatalogGrid searchParams={params} />
              </Suspense>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
