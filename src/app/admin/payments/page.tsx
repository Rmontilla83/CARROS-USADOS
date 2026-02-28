import type { Metadata } from "next";
import { DollarSign, CheckCircle2, Clock, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PaymentTable } from "@/components/admin/payment-table";
import type { Payment } from "@/types";

export const metadata: Metadata = {
  title: "Pagos — Admin",
};

type PaymentRow = Pick<
  Payment,
  "id" | "amount" | "currency" | "method" | "status" | "paid_at" | "description" | "created_at"
>;

export default async function AdminPaymentsPage() {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, currency, method, status, paid_at, description, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const typedPayments = (payments as PaymentRow[]) || [];

  // Stats
  const totalRevenue = typedPayments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const completedCount = typedPayments.filter((p) => p.status === "completed").length;
  const pendingCount = typedPayments.filter((p) => p.status === "pending").length;
  const failedCount = typedPayments.filter((p) => p.status === "failed").length;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pagos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestión de pagos y transacciones
        </p>
      </div>

      {/* Stats cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
              <DollarSign className="size-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ingresos</p>
              <p className="text-xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
              <CheckCircle2 className="size-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completados</p>
              <p className="text-xl font-bold text-foreground">{completedCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100">
              <Clock className="size-5 text-yellow-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pendientes</p>
              <p className="text-xl font-bold text-foreground">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
              <XCircle className="size-5 text-red-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fallidos</p>
              <p className="text-xl font-bold text-foreground">{failedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payments table */}
      <div className="mt-6">
        <PaymentTable payments={typedPayments} />
      </div>
    </div>
  );
}
