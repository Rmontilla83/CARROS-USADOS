import Link from "next/link";
import { Car, Eye, QrCode } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Vehicle, Media } from "@/types";

type FeaturedVehicle = Pick<
  Vehicle,
  "id" | "brand" | "model" | "year" | "price" | "slug" | "mileage" | "transmission" | "fuel" | "views_count"
>;

const TRANSMISSION_LABELS: Record<string, string> = {
  manual: "Manual",
  automatic: "Automática",
  cvt: "CVT",
};

const FUEL_LABELS: Record<string, string> = {
  gasoline: "Gasolina",
  diesel: "Diésel",
  electric: "Eléctrico",
  hybrid: "Híbrido",
  gas: "Gas",
};

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function Home() {
  const supabase = await createClient();

  // Fetch active vehicles, most recent first
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, brand, model, year, price, slug, mileage, transmission, fuel, views_count")
    .eq("status", "active")
    .order("published_at", { ascending: false })
    .limit(12);

  const typedVehicles = (vehicles as FeaturedVehicle[]) || [];

  // Fetch cover photos
  let coverMap = new Map<string, string>();
  if (typedVehicles.length > 0) {
    const vehicleIds = typedVehicles.map((v) => v.id);
    const { data: covers } = await supabase
      .from("media")
      .select("vehicle_id, url")
      .in("vehicle_id", vehicleIds)
      .eq("type", "photo")
      .eq("is_cover", true);

    if (covers) {
      for (const c of covers as Pick<Media, "vehicle_id" | "url">[]) {
        coverMap.set(c.vehicle_id, c.url);
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <span className="text-xl font-bold text-primary">CarrosUsados</span>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
            >
              Registrarse
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="bg-primary py-20 text-primary-foreground">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Tu carro es tu mejor vitrina
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/80">
              Publica tu vehículo, recibe un vinil QR, pégalo en tu carro y
              deja que los compradores escaneen para ver todos los detalles.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="rounded-lg bg-accent px-8 py-3 text-lg font-semibold text-accent-foreground hover:bg-accent/90"
              >
                Publicar mi carro — $10
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-center text-3xl font-bold text-foreground">
              ¿Cómo funciona?
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Publica",
                  description:
                    "Sube las fotos, datos y precio de tu vehículo en minutos.",
                },
                {
                  step: "2",
                  title: "Recibe tu QR",
                  description:
                    "Te entregamos un vinil QR profesional para pegar en tu carro.",
                },
                {
                  step: "3",
                  title: "Vende",
                  description:
                    "Los interesados escanean el QR y ven toda la info. Te contactan por WhatsApp.",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured vehicles */}
        <section className="bg-secondary py-20">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-center text-3xl font-bold text-foreground">
              Vehículos Disponibles
            </h2>
            <p className="mt-2 text-center text-muted-foreground">
              Encuentra tu próximo carro
            </p>

            {typedVehicles.length === 0 ? (
              <div className="mt-12 rounded-lg border border-border bg-card p-12 text-center">
                <Car className="mx-auto size-12 text-muted-foreground/40" />
                <p className="mt-4 text-muted-foreground">
                  Aún no hay vehículos publicados. ¡Sé el primero!
                </p>
                <Link
                  href="/register"
                  className="mt-4 inline-block rounded-lg bg-accent px-6 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
                >
                  Publicar mi carro
                </Link>
              </div>
            ) : (
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {typedVehicles.map((vehicle) => {
                  const coverUrl = coverMap.get(vehicle.id);
                  return (
                    <Link
                      key={vehicle.id}
                      href={`/${vehicle.slug}`}
                      className="group overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg"
                    >
                      {/* Cover photo */}
                      <div className="relative aspect-[4/3] bg-secondary">
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
                            loading="lazy"
                            className="size-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <Car className="size-12 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="truncate text-lg font-semibold text-foreground group-hover:text-primary">
                          {vehicle.brand} {vehicle.model} {vehicle.year}
                        </h3>
                        <p className="mt-1 text-2xl font-bold text-accent">
                          ${vehicle.price.toLocaleString("en-US")}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {vehicle.mileage != null && (
                            <span className="rounded-full bg-secondary px-2 py-0.5">
                              {vehicle.mileage.toLocaleString()} km
                            </span>
                          )}
                          <span className="rounded-full bg-secondary px-2 py-0.5">
                            {TRANSMISSION_LABELS[vehicle.transmission]}
                          </span>
                          <span className="rounded-full bg-secondary px-2 py-0.5">
                            {FUEL_LABELS[vehicle.fuel]}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} CarrosUsados. Barcelona,
            Anzoátegui, Venezuela.
          </p>
        </div>
      </footer>
    </div>
  );
}
