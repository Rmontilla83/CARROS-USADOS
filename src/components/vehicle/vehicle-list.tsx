import { createClient } from "@/lib/supabase/server";
import { VinylDownloadCard } from "./vinyl-download-card";
import type { Vehicle, QrOrder } from "@/types";

export async function VehicleList() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch user's vehicles
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, brand, model, year, slug, status, price")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Aún no tienes vehículos publicados.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Haz clic en &quot;Publicar Vehículo&quot; para comenzar.
        </p>
      </div>
    );
  }

  const typedVehicles = vehicles as Pick<
    Vehicle,
    "id" | "brand" | "model" | "year" | "slug" | "status" | "price"
  >[];

  // Fetch QR orders for all user vehicles
  const vehicleIds = typedVehicles.map((v) => v.id);
  const { data: qrOrders } = await supabase
    .from("qr_orders")
    .select("vehicle_id, qr_image_url")
    .in("vehicle_id", vehicleIds);

  const qrMap = new Map<string, string | null>();
  if (qrOrders) {
    for (const order of qrOrders as Pick<QrOrder, "vehicle_id" | "qr_image_url">[]) {
      qrMap.set(order.vehicle_id, order.qr_image_url);
    }
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Mis Vehículos
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {typedVehicles.map((vehicle) => (
          <VinylDownloadCard
            key={vehicle.id}
            vehicleId={vehicle.id}
            brand={vehicle.brand}
            model={vehicle.model}
            year={vehicle.year}
            slug={vehicle.slug}
            existingVinylUrl={qrMap.get(vehicle.id) ?? null}
          />
        ))}
      </div>
    </div>
  );
}
