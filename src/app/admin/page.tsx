import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminStats } from "@/components/admin/admin-stats";
import { AiDailyInsight } from "@/components/admin/ai-daily-insight";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default function AdminDashboardPage() {
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
