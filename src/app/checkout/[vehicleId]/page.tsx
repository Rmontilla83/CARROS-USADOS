import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getBcvRate } from "@/lib/payments/bcv-rate";
import { PUBLICATION_PRICE_USD } from "@/lib/constants";
import { PaymentMethodSelector } from "@/components/checkout/payment-method-selector";
import type { Vehicle, Media } from "@/types";

export const metadata: Metadata = {
  title: "Checkout — Pagar Publicación",
};

type VehicleRow = Pick<Vehicle, "id" | "brand" | "model" | "year" | "price" | "status" | "user_id">;

interface Props {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<{ cancelled?: string }>;
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { vehicleId } = await params;
  const { cancelled } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/checkout/" + vehicleId);
  }

  // Fetch vehicle — must be draft and owned by user
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, brand, model, year, price, status, user_id")
    .eq("id", vehicleId)
    .single();

  const typedVehicle = vehicle as VehicleRow | null;

  if (!typedVehicle || typedVehicle.user_id !== user.id) {
    redirect("/dashboard");
  }

  if (typedVehicle.status !== "draft") {
    // Already paid — go to dashboard
    redirect("/dashboard?already_active=true");
  }

  // Fetch cover photo
  const { data: coverData } = await supabase
    .from("media")
    .select("url")
    .eq("vehicle_id", vehicleId)
    .eq("type", "photo")
    .eq("is_cover", true)
    .limit(1)
    .single();

  const coverUrl = (coverData as Pick<Media, "url"> | null)?.url || null;

  // Get BCV rate
  const bcvRate = await getBcvRate();
  const priceVes = PUBLICATION_PRICE_USD * bcvRate;

  const vehicleTitle = `${typedVehicle.brand} ${typedVehicle.model} ${typedVehicle.year}`;

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <h1 className="text-2xl font-bold text-foreground">Pagar Publicación</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Completa el pago para activar tu publicación
        </p>

        {/* Vehicle summary card */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex gap-4 p-4">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={vehicleTitle}
                className="size-20 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                <span className="text-2xl">🚗</span>
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-foreground">
                {vehicleTitle}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Precio del vehículo: ${typedVehicle.price.toLocaleString("en-US")}
              </p>
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="mt-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Publicación (60 días)</span>
            <span className="text-lg font-bold text-foreground">
              ${PUBLICATION_PRICE_USD.toFixed(2)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Equivalente en bolívares</span>
            <span className="text-sm text-muted-foreground">
              Bs. {priceVes.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Tasa BCV: Bs. {bcvRate.toFixed(2)} / USD
          </p>
        </div>

        {/* Payment method selector */}
        <PaymentMethodSelector
          vehicleId={vehicleId}
          cancelled={cancelled === "true"}
        />
      </div>
    </div>
  );
}
