import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getUserAlerts } from "@/lib/actions/alerts";
import { AlertList } from "@/components/dashboard/alert-list";
import { MAX_ACTIVE_ALERTS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Mis Alertas — Dashboard",
};

export default async function AlertsPage() {
  const alerts = await getUserAlerts();
  const activeCount = alerts.filter((a) => a.status === "active").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Alertas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Recibe notificaciones cuando se publique un vehículo que coincida con tu búsqueda.
            {" "}({activeCount}/{MAX_ACTIVE_ALERTS} activas)
          </p>
        </div>
        {activeCount < MAX_ACTIVE_ALERTS && (
          <Link
            href="/dashboard/alerts/create"
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
          >
            <Plus className="size-4" />
            Nueva alerta
          </Link>
        )}
      </div>

      <div className="mt-6">
        <AlertList alerts={alerts} />
      </div>
    </div>
  );
}
