import type { Metadata } from "next";
import { Suspense } from "react";
import { QrOrderTable } from "@/components/admin/qr-order-table";

export const metadata: Metadata = {
  title: "Cola QR — Admin",
};

export default function QrOrdersPage() {
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
        <QrOrderTable />
      </Suspense>
    </div>
  );
}
