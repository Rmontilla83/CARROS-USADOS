import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuccessMessage } from "@/components/layout/success-message";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mi Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Gestiona tus vehículos publicados
          </p>
        </div>
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/dashboard/publish">
            <Plus className="size-4" />
            Publicar Vehículo
          </Link>
        </Button>
      </div>

      <Suspense>
        <SuccessMessage />
      </Suspense>

      <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Aún no tienes vehículos publicados.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Haz clic en &quot;Publicar Vehículo&quot; para comenzar.
        </p>
      </div>
    </div>
  );
}
