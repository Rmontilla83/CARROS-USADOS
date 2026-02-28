import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminUserTable } from "@/components/admin/admin-user-table";
import { AccessDenied } from "@/components/admin/access-denied";
import { canViewUsers, getDefaultAdminRoute } from "@/lib/permissions";
import type { Profile } from "@/types";

export const metadata: Metadata = {
  title: "Usuarios — Admin",
};

export default async function AdminUsersPage() {
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
  if (!role || !canViewUsers(role)) {
    return <AccessDenied defaultRoute={getDefaultAdminRoute(role ?? "seller")} />;
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Usuarios registrados en la plataforma
        </p>
      </div>

      <Suspense
        fallback={
          <div className="mt-6 h-96 animate-pulse rounded-lg border border-border bg-card" />
        }
      >
        <AdminUserTable userRole={role} />
      </Suspense>
    </div>
  );
}
