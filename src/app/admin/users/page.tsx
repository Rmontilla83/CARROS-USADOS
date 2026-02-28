import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminUserTable } from "@/components/admin/admin-user-table";

export const metadata: Metadata = {
  title: "Usuarios — Admin",
};

export default function AdminUsersPage() {
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
        <AdminUserTable />
      </Suspense>
    </div>
  );
}
