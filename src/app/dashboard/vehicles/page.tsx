import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehicleCards } from "@/components/dashboard/vehicle-cards";

export const metadata: Metadata = {
  title: "Mis Vehículos",
};

export default function VehiclesPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Vehículos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona tus publicaciones
          </p>
        </div>
        <Button
          asChild
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Link href="/dashboard/publish">
            <Plus className="size-4" />
            Publicar
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-lg border border-border bg-card"
              />
            ))}
          </div>
        }
      >
        <VehicleCards />
      </Suspense>
    </div>
  );
}
