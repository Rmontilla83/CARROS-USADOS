import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { QrOrderTable } from "@/components/admin/qr-order-table";
import { AccessDenied } from "@/components/admin/access-denied";
import { canViewQrOrders, getDefaultAdminRoute } from "@/lib/permissions";
import type { Profile } from "@/types";

export const metadata: Metadata = {
  title: "Cola QR — Admin",
};

export default async function QrOrdersPage() {
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
  if (!role || !canViewQrOrders(role)) {
    return <AccessDenied defaultRoute={getDefaultAdminRoute(role ?? "seller")} />;
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cola de QR</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona la impresión y entrega de viniles QR
        </p>
      </div>

      <Suspense
        fallback={
          <div className="mt-6 h-96 animate-pulse rounded-lg border border-border bg-card" />
        }
      >
        <QrOrderTable userRole={role} userId={user.id} />
      </Suspense>
    </div>
  );
}
