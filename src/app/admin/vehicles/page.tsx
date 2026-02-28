import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminVehicleTable } from "@/components/admin/admin-vehicle-table";

export const metadata: Metadata = {
  title: "Publicaciones — Admin",
};

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

export default async function AdminVehiclesPage({ searchParams }: PageProps) {
  const { status, q } = await searchParams;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Publicaciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Modera y gestiona las publicaciones de vehículos
        </p>
      </div>

      <Suspense
        fallback={
          <div className="mt-6 h-96 animate-pulse rounded-lg border border-border bg-card" />
        }
      >
        <AdminVehicleTable statusFilter={status} searchQuery={q} />
      </Suspense>
    </div>
  );
}
