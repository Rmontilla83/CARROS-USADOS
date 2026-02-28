import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminStats } from "@/components/admin/admin-stats";
import { AiDailyInsight } from "@/components/admin/ai-daily-insight";
import { canViewDashboard, getDefaultAdminRoute } from "@/lib/permissions";
import type { Profile } from "@/types";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
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
  if (!role || !canViewDashboard(role)) {
    redirect(getDefaultAdminRoute(role ?? "seller"));
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vista general de la plataforma
        </p>
      </div>

      {/* AI Daily Insight */}
      <div className="mt-6">
        <AiDailyInsight />
      </div>

      <Suspense
        fallback={
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-lg border border-border bg-card"
              />
            ))}
          </div>
        }
      >
        <AdminStats />
      </Suspense>
    </div>
  );
}
