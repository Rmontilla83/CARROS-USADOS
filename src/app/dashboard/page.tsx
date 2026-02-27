import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Mi Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Bienvenido a tu panel de vendedor. Aquí podrás gestionar tus vehículos
        publicados.
      </p>

      <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Aún no tienes vehículos publicados.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          La funcionalidad de publicación estará disponible en la Fase D.
        </p>
      </div>
    </div>
  );
}
