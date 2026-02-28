"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VENEZUELAN_BANKS } from "@/lib/payments/mercantil-banks";

interface Props {
  vehicleId: string;
  amountVes: number;
  onSuccess: () => void;
  onCancel: () => void;
}

type Step = "form" | "waiting" | "success" | "error";

export function C2PPaymentForm({ vehicleId, amountVes, onSuccess, onCancel }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [phone, setPhone] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [cedula, setCedula] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/mercantil/c2p/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId, phone, bankCode, cedula }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear el cobro");
        setLoading(false);
        return;
      }

      setPaymentId(data.paymentId);
      setStep("waiting");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const pollStatus = useCallback(async () => {
    if (!paymentId) return;

    try {
      const res = await fetch(`/api/payments/mercantil/c2p/status/${paymentId}`);
      const data = await res.json();

      if (data.status === "completed") {
        setStep("success");
        setTimeout(onSuccess, 1500);
      } else if (data.status === "failed") {
        setStep("error");
        setError("El pago fue rechazado. Intenta de nuevo.");
      }
    } catch {
      // Silently retry
    }
  }, [paymentId, onSuccess]);

  useEffect(() => {
    if (step !== "waiting") return;

    const interval = setInterval(pollStatus, 4000);
    return () => clearInterval(interval);
  }, [step, pollStatus]);

  if (step === "success") {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
        <CheckCircle2 className="mx-auto size-12 text-accent" />
        <p className="mt-3 font-semibold text-foreground">Pago confirmado</p>
        <p className="mt-1 text-sm text-muted-foreground">Redirigiendo...</p>
      </div>
    );
  }

  if (step === "waiting") {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
        <Loader2 className="mx-auto size-10 animate-spin text-primary" />
        <p className="mt-4 font-semibold text-foreground">
          Esperando confirmación...
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisa tu teléfono y confirma el pago de
          <strong> Bs. {amountVes.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</strong> en tu app bancaria.
        </p>
        <Button variant="ghost" className="mt-4" onClick={() => { setStep("form"); setPaymentId(null); }}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="c2p-phone" className="mb-1.5 block text-sm font-medium text-foreground">
          Teléfono
        </label>
        <input
          id="c2p-phone"
          type="tel"
          placeholder="04121234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
          required
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="c2p-bank" className="mb-1.5 block text-sm font-medium text-foreground">
          Banco
        </label>
        <select
          id="c2p-bank"
          value={bankCode}
          onChange={(e) => setBankCode(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Selecciona tu banco</option>
          {VENEZUELAN_BANKS.map((bank) => (
            <option key={bank.code} value={bank.code}>
              {bank.code} — {bank.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="c2p-cedula" className="mb-1.5 block text-sm font-medium text-foreground">
          Cédula
        </label>
        <div className="flex gap-2">
          <select
            className="w-16 rounded-lg border border-border bg-white px-2 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            defaultValue="V"
          >
            <option value="V">V</option>
            <option value="E">E</option>
          </select>
          <input
            id="c2p-cedula"
            type="text"
            placeholder="12345678"
            value={cedula}
            onChange={(e) => setCedula(e.target.value.replace(/\D/g, "").slice(0, 10))}
            required
            className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || !phone || !bankCode || !cedula}
          className="flex-1 bg-primary text-white hover:bg-primary/90"
        >
          {loading ? "Procesando..." : `Pagar Bs. ${amountVes.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`}
        </Button>
      </div>
    </form>
  );
}
