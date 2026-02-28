"use client";

import { useState } from "react";
import { CreditCard, Smartphone, Landmark, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PAYMENT_METHODS } from "@/lib/constants";

interface Props {
  vehicleId: string;
  cancelled: boolean;
}

export function PaymentMethodSelector({ vehicleId, cancelled }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStripeCheckout() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/stripe/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error || "Error al crear la sesión de pago");
        setLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      {cancelled && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
          El pago fue cancelado. Puedes intentar de nuevo cuando quieras.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <h3 className="text-sm font-semibold text-foreground">
        Selecciona tu método de pago
      </h3>

      {/* Stripe — active */}
      <button
        onClick={handleStripeCheckout}
        disabled={loading}
        className="group w-full rounded-2xl border-2 border-primary/20 bg-white p-5 text-left shadow-sm transition-all hover:border-primary hover:shadow-md disabled:opacity-50"
      >
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <CreditCard className="size-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">
              {PAYMENT_METHODS.stripe.label}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Visa, Mastercard, American Express
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0 bg-primary text-white hover:bg-primary/90"
            disabled={loading}
            tabIndex={-1}
          >
            {loading ? "Cargando..." : "Pagar"}
          </Button>
        </div>
      </button>

      {/* Mercantil section — disabled */}
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Pago en Bolívares — Próximamente
        </p>

        {/* Pago Móvil C2P */}
        <div className="w-full rounded-2xl border border-border bg-white/60 p-5 opacity-50">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <Smartphone className="size-6 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-muted-foreground">
                {PAYMENT_METHODS.mercantil_c2p.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Paga desde tu teléfono con cualquier banco
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
              Próximamente
            </span>
          </div>
        </div>

        {/* Débito Inmediato */}
        <div className="w-full rounded-2xl border border-border bg-white/60 p-5 opacity-50">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <Landmark className="size-6 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-muted-foreground">
                {PAYMENT_METHODS.mercantil_debit.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Débito directo desde tu cuenta bancaria
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
              Próximamente
            </span>
          </div>
        </div>

        {/* Tarjeta Nacional */}
        <div className="w-full rounded-2xl border border-border bg-white/60 p-5 opacity-50">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <CreditCard className="size-6 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-muted-foreground">
                {PAYMENT_METHODS.mercantil_card.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tarjeta de débito o crédito nacional
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
              Próximamente
            </span>
          </div>
        </div>
      </div>

      {/* Security badges */}
      <div className="flex items-center justify-center gap-6 pt-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Lock className="size-3.5" />
          Pago seguro
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" />
          Datos encriptados
        </span>
      </div>
    </div>
  );
}
