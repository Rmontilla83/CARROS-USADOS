import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { isInternalRole, getDefaultAdminRoute } from "@/lib/permissions";
import type { Profile, UserRole } from "@/types";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Pick<Profile, "full_name" | "email" | "role"> | null;

  if (!typedProfile || !isInternalRole(typedProfile.role)) {
    redirect("/dashboard");
  }

  const userRole = typedProfile.role;

  // Fetch notification counts in parallel
  const [pendingVehiclesRes, pendingQrRes, assignedToMeRes, pendingPaymentsRes] =
    await Promise.all([
      supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending_review"),
      supabase
        .from("qr_orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("qr_orders")
        .select("*", { count: "exact", head: true })
        .eq("courier_id", user.id)
        .in("status", ["assigned"]),
      supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

  const counts = {
    pendingVehicles: pendingVehiclesRes.count ?? 0,
    pendingQr: pendingQrRes.count ?? 0,
    assignedToMe: assignedToMeRes.count ?? 0,
    pendingPayments: pendingPaymentsRes.count ?? 0,
  };

  const displayName =
    typedProfile.full_name || user.user_metadata?.full_name || user.email || "";

  return (
    <div className="min-h-screen bg-secondary">
      <AdminSidebar
        userName={displayName}
        userEmail={user.email || ""}
        userRole={userRole}
        counts={counts}
      />
      <div className="lg:pl-60">
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
