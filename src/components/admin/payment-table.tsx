"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { canApprovePayments } from "@/lib/permissions";
import { approvePayment, rejectPayment } from "@/lib/actions/admin";
import type { Payment, PaymentStatus, PaymentMethod, UserRole } from "@/types";

type PaymentRow = Pick<
  Payment,
  "id" | "amount" | "currency" | "method" | "status" | "paid_at" | "description" | "created_at"
>;

interface Props {
  payments: PaymentRow[];
  userRole: UserRole;
}

const STATUS_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  completed: {
    label: "Completado",
    className: "bg-accent/15 text-accent border-accent/30",
  },
  pending: {
    label: "Pendiente",
    className: "bg-yellow-100 text-yellow-700 border-yellow-300",
  },
  failed: {
    label: "Fallido",
    className: "bg-red-100 text-red-700 border-red-300",
  },
  refunded: {
    label: "Reembolsado",
    className: "bg-gray-100 text-gray-600 border-gray-300",
  },
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  stripe: "Stripe",
  bank_transfer: "Transferencia",
  pago_movil: "Pago Móvil",
  zelle: "Zelle",
  mercantil_c2p: "Mercantil C2P",
  mercantil_debit: "Débito Inmediato",
  mercantil_card: "Tarjeta Nacional",
};

function PaymentActions({ paymentId, status, userRole }: { paymentId: string; status: PaymentStatus; userRole: UserRole }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  if (status !== "pending" || !canApprovePayments(userRole)) return null;

  async function handleApprove() {
    setLoading("approve");
    const result = await approvePayment(paymentId);
    if (result.success) router.refresh();
    setLoading(null);
  }

  async function handleReject() {
    const reason = prompt("Razón del rechazo:");
    if (!reason) return;
    setLoading("reject");
    const result = await rejectPayment(paymentId, reason);
    if (result.success) router.refresh();
    setLoading(null);
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        onClick={handleApprove}
        disabled={loading !== null}
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-accent hover:bg-accent/10 hover:text-accent"
      >
        {loading === "approve" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Check className="size-3.5" />
        )}
        <span className="hidden sm:inline">Aprobar</span>
      </Button>
      <Button
        onClick={handleReject}
        disabled={loading !== null}
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        {loading === "reject" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <X className="size-3.5" />
        )}
        <span className="hidden sm:inline">Rechazar</span>
      </Button>
    </div>
  );
}

export function PaymentTable({ payments, userRole }: Props) {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "all">("all");
  const showActions = canApprovePayments(userRole);

  const filtered = payments.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (methodFilter !== "all" && p.method !== methodFilter) return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | "all")}
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground"
        >
          <option value="all">Todos los estados</option>
          <option value="completed">Completado</option>
          <option value="pending">Pendiente</option>
          <option value="failed">Fallido</option>
          <option value="refunded">Reembolsado</option>
        </select>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | "all")}
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground"
        >
          <option value="all">Todos los métodos</option>
          <option value="stripe">Stripe</option>
          <option value="pago_movil">Pago Móvil</option>
          <option value="bank_transfer">Transferencia</option>
          <option value="zelle">Zelle</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Estado</TableHead>
                {showActions && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showActions ? 6 : 5} className="py-8 text-center text-sm text-muted-foreground">
                    No se encontraron pagos
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((payment) => {
                  const statusCfg = STATUS_CONFIG[payment.status];
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString("es-VE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {payment.description || "Publicación de vehículo"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {METHOD_LABELS[payment.method]}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-foreground">
                        ${payment.amount.toFixed(2)} {payment.currency}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={`border text-[11px] ${statusCfg.className}`}>
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      {showActions && (
                        <TableCell className="text-right">
                          <PaymentActions
                            paymentId={payment.id}
                            status={payment.status}
                            userRole={userRole}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-border sm:hidden">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No se encontraron pagos
            </p>
          ) : (
            filtered.map((payment) => {
              const statusCfg = STATUS_CONFIG[payment.status];
              return (
                <div key={payment.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {payment.description || "Publicación de vehículo"}
                    </p>
                    <Badge className={`shrink-0 border text-[11px] ${statusCfg.className}`}>
                      {statusCfg.label}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(payment.created_at).toLocaleDateString("es-VE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {METHOD_LABELS[payment.method]}
                    </span>
                    <span className="font-medium text-foreground">
                      ${payment.amount.toFixed(2)} {payment.currency}
                    </span>
                  </div>
                  {showActions && (
                    <div className="mt-2">
                      <PaymentActions
                        paymentId={payment.id}
                        status={payment.status}
                        userRole={userRole}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
