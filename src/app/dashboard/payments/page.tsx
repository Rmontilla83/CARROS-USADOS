import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Pagos",
};

// Mock payment data — will be replaced with real Supabase queries
const MOCK_PAYMENTS = [
  {
    id: "pay_001",
    date: "2026-02-15",
    description: "Publicación — Toyota Corolla 2020",
    amount: 10,
    currency: "USD",
    method: "Zelle",
    status: "completed" as const,
  },
  {
    id: "pay_002",
    date: "2026-02-10",
    description: "Publicación — Chevrolet Aveo 2018",
    amount: 10,
    currency: "USD",
    method: "Pago Móvil",
    status: "completed" as const,
  },
  {
    id: "pay_003",
    date: "2026-01-28",
    description: "Publicación — Ford Explorer 2019",
    amount: 10,
    currency: "USD",
    method: "Stripe",
    status: "pending" as const,
  },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
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

export default function PaymentsPage() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pagos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historial de pagos y transacciones
        </p>
      </div>

      {/* Info banner */}
      <div className="mt-6 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <CreditCard className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Sistema de pagos en desarrollo
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Los datos mostrados son de ejemplo. Próximamente podrás gestionar
            tus pagos con Stripe, Zelle y Pago Móvil.
          </p>
        </div>
      </div>

      {/* Payments table */}
      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
        {/* Desktop table */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_PAYMENTS.map((payment) => {
                const statusCfg = STATUS_CONFIG[payment.status];
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(payment.date).toLocaleDateString("es-VE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {payment.description}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.method}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-foreground">
                      ${payment.amount.toFixed(2)} {payment.currency}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        className={`border text-[11px] ${statusCfg.className}`}
                      >
                        {statusCfg.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-border sm:hidden">
          {MOCK_PAYMENTS.map((payment) => {
            const statusCfg = STATUS_CONFIG[payment.status];
            return (
              <div key={payment.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {payment.description}
                  </p>
                  <Badge
                    className={`shrink-0 border text-[11px] ${statusCfg.className}`}
                  >
                    {statusCfg.label}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {new Date(payment.date).toLocaleDateString("es-VE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {payment.method}
                  </span>
                  <span className="font-medium text-foreground">
                    ${payment.amount.toFixed(2)} {payment.currency}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
