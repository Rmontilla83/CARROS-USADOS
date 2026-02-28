import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminVehicleTable } from "@/components/admin/admin-vehicle-table";
import { AccessDenied } from "@/components/admin/access-denied";
import { canViewVehicles, getDefaultAdminRoute } from "@/lib/permissions";
import type { Profile } from "@/types";

export const metadata: Metadata = {
  title: "Publicaciones — Admin",
};

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

export default async function AdminVehiclesPage({ searchParams }: PageProps) {
  const { status, q } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as Pick<Profile, "role"> | null)?.role;
  if (!role || !canViewVehicles(role)) {
    return <AccessDenied defaultRoute={getDefaultAdminRoute(role ?? "seller")} />;
  }

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
        <AdminVehicleTable statusFilter={status} searchQuery={q} userRole={role} />
      </Suspense>
    </div>
  );
}
