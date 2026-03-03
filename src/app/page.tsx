import Image from "next/image";
import Link from "next/link";
import {
  Car,
  QrCode,
  BarChart3,
  Brain,
  Megaphone,
  Shield,
  CheckCircle2,
  ArrowRight,
  Eye,
  MapPin,
  Gauge,
  Fuel,
  Cog,
  Star,
  Bell,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TrustBadges } from "@/components/vehicle/trust-badges";
import { computeTrustBadgesBatch } from "@/lib/trust-badges";
import { createClient } from "@/lib/supabase/server";
import { PUBLICATION_PRICE_USD } from "@/lib/constants";
import type { Vehicle, Media } from "@/types";

type FeaturedVehicle = Pick<
  Vehicle,
  "id" | "brand" | "model" | "year" | "price" | "slug" | "mileage" | "transmission" | "fuel" | "views_count" | "conditions" | "user_id"
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

export const revalidate = 60;

export default async function Home() {
  const supabase = await createClient();

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, brand, model, year, price, slug, mileage, transmission, fuel, views_count, conditions, user_id")
    .eq("status", "active")
    .order("published_at", { ascending: false })
    .limit(12);

  const typedVehicles = (vehicles as FeaturedVehicle[]) || [];

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

  // Batch-fetch trust badge data
  let badgesMap = new Map<string, import("@/lib/trust-badges").TrustBadge[]>();
  if (typedVehicles.length > 0) {
    const vehicleIds = typedVehicles.map((v) => v.id);
    const userIds = [...new Set(typedVehicles.map((v) => v.user_id))];

    const [{ data: photoRows }, { data: aiRows }, { data: profileRows }] = await Promise.all([
      supabase
        .from("media")
        .select("vehicle_id, created_at")
        .in("vehicle_id", vehicleIds)
        .eq("type", "photo")
        .order("created_at", { ascending: false }),
      supabase
        .from("ai_price_reports")
        .select("vehicle_id, price_market_avg")
        .in("vehicle_id", vehicleIds),
      supabase
        .from("profiles")
        .select("id, is_verified")
        .in("id", userIds),
    ]);

    const latestPhotoDates = new Map<string, string>();
    if (photoRows) {
      for (const r of photoRows as { vehicle_id: string; created_at: string }[]) {
        if (!latestPhotoDates.has(r.vehicle_id)) {
          latestPhotoDates.set(r.vehicle_id, r.created_at);
        }
      }
    }

    const aiMarketAvgs = new Map<string, number>();
    if (aiRows) {
      for (const r of aiRows as { vehicle_id: string; price_market_avg: number | null }[]) {
        if (r.price_market_avg != null) aiMarketAvgs.set(r.vehicle_id, r.price_market_avg);
      }
    }

    const sellerVerifiedMap = new Map<string, boolean>();
    if (profileRows) {
      for (const r of profileRows as { id: string; is_verified: boolean }[]) {
        sellerVerifiedMap.set(r.id, r.is_verified);
      }
    }

    const vehicleSellerVerified = new Map<string, boolean>();
    for (const v of typedVehicles) {
      vehicleSellerVerified.set(v.id, sellerVerifiedMap.get(v.user_id) ?? false);
    }

    badgesMap = computeTrustBadgesBatch(typedVehicles, latestPhotoDates, aiMarketAvgs, vehicleSellerVerified);
  }

  // Stats for social proof
  const { count: totalVehicles } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const totalViews = typedVehicles.reduce((sum, v) => sum + (v.views_count || 0), 0);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar transparent />

      {/* =================== HERO (split 50/50) =================== */}
      <section className="relative overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Image — top on mobile (40vh), right on desktop */}
          <div className="relative h-[40vh] w-full md:order-last md:h-auto md:min-h-[600px] md:w-1/2 lg:min-h-[700px]">
            <picture>
              <source media="(max-width: 768px)" srcSet="/images/hero-bg-mobile.webp" />
              <source srcSet="/images/hero-bg.webp" />
              <img
                src="/images/hero-bg.webp"
                alt="Persona escaneando código QR en vehículo"
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 size-full object-cover object-center"
              />
            </picture>
            {/* Desktop: diagonal gradient transition from blue to image */}
            <div
              className="absolute inset-y-0 -left-4 hidden w-32 bg-gradient-to-r from-[#1B4F72] via-[#1B4F72]/40 to-transparent md:block"
              style={{ transform: "skewX(-3deg)" }}
            />
            {/* Mobile: gradient fade from image to blue section below */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#1B4F72] to-transparent md:hidden" />
          </div>

          {/* Text content — bottom on mobile, left on desktop */}
          <div className="relative z-10 flex w-full items-center bg-[#1B4F72] px-6 pb-20 pt-8 sm:px-10 md:w-1/2 md:pb-24 md:pt-28 lg:px-16 xl:px-20">
            <div className="w-full max-w-xl">
              {/* Trust badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/90 backdrop-blur-sm">
                <QrCode className="size-4" />
                <span>La nueva forma de vender carros en Venezuela</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Tu carro es tu{" "}
                <span className="relative">
                  <span className="relative z-10 text-accent">mejor vitrina</span>
                </span>
              </h1>

              <p className="mt-6 max-w-md text-lg leading-relaxed text-white/75 sm:text-xl">
                Publica tu vehículo, recibe un vinil QR profesional, pégalo en tu carro y
                deja que los compradores escaneen para ver todos los detalles.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="group flex items-center gap-2 rounded-xl bg-accent px-8 py-4 text-lg font-bold text-white shadow-xl shadow-accent/25 transition-all hover:bg-accent/90 hover:shadow-2xl hover:shadow-accent/30"
                >
                  Publicar mi carro — ${PUBLICATION_PRICE_USD}
                  <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/catalogo"
                  className="flex items-center gap-2 rounded-xl border border-white/20 px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  <Eye className="size-4" />
                  Ver vehículos disponibles
                </Link>
              </div>

              {/* Social proof mini stats */}
              <div className="mt-12 flex items-center gap-8 text-white/60">
                <div>
                  <p className="text-2xl font-bold text-white">{totalVehicles || 0}+</p>
                  <p className="text-xs">Vehículos</p>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div>
                  <p className="text-2xl font-bold text-white">{totalViews || 0}+</p>
                  <p className="text-xs">Visitas</p>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div>
                  <p className="text-2xl font-bold text-white">3</p>
                  <p className="text-xs">Ciudades</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full">
            <path d="M0 80h1440V30C1200 70 960 0 720 30S240 80 0 50v30z" fill="white" />
          </svg>
        </div>
      </section>

      <main className="flex-1">
        {/* =================== HOW IT WORKS =================== */}
        <section id="como-funciona" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">Proceso simple</p>
              <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
                ¿Cómo funciona?
              </h2>
              <p className="mt-3 text-muted-foreground">
                En 3 simples pasos vendes tu carro
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "1",
                  icon: Car,
                  title: "Publica tu carro",
                  description: "Sube las fotos, datos y precio de tu vehículo. Nuestro sistema crea una tarjeta digital profesional.",
                  color: "bg-primary text-white",
                },
                {
                  step: "2",
                  icon: QrCode,
                  title: "Recibe tu vinil QR",
                  description: "Te entregamos un vinil QR profesional para pegar en tu carro. Los interesados lo escanean desde la calle.",
                  color: "bg-accent text-white",
                },
                {
                  step: "3",
                  icon: Star,
                  title: "¡Vende!",
                  description: "Los compradores ven toda la info, fotos y video. Te contactan directo por WhatsApp.",
                  color: "bg-orange-500 text-white",
                },
              ].map((item) => (
                <div key={item.step} className="group relative text-center">
                  {/* Connector line */}
                  {item.step !== "3" && (
                    <div className="absolute right-0 top-12 hidden h-0.5 w-1/2 bg-gradient-to-r from-border to-transparent md:block" />
                  )}
                  <div className={`mx-auto flex size-20 items-center justify-center rounded-2xl shadow-lg transition-transform group-hover:scale-110 ${item.color}`}>
                    <item.icon className="size-8" />
                  </div>
                  <div className="mt-1 inline-flex items-center justify-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                    Paso {item.step}
                  </div>
                  <h3 className="mt-3 text-xl font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =================== FEATURED VEHICLES =================== */}
        <section id="vehiculos" className="bg-secondary/50 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-accent">Catálogo</p>
                <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
                  Vehículos disponibles
                </h2>
              </div>
              {typedVehicles.length > 0 && (
                <div className="hidden items-center gap-4 sm:flex">
                  <Link
                    href="/catalogo"
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Ver todos
                    <ArrowRight className="size-3.5" />
                  </Link>
                  <Link
                    href="/dashboard/publish"
                    className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                  >
                    Publica el tuyo
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {typedVehicles.length === 0 ? (
              <div className="mt-12 rounded-2xl border border-dashed border-border bg-white p-16 text-center">
                <Car className="mx-auto size-16 text-muted-foreground/20" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  Sé el primero en publicar
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Aún no hay vehículos publicados. ¡Publica el tuyo por solo ${PUBLICATION_PRICE_USD}!
                </p>
                <Link
                  href="/register"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-accent/90"
                >
                  Publicar mi carro
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            ) : (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {typedVehicles.map((vehicle) => {
                  const coverUrl = coverMap.get(vehicle.id);
                  const vehicleBadges = badgesMap.get(vehicle.id) ?? [];
                  return (
                    <Link
                      key={vehicle.id}
                      href={`/${vehicle.slug}`}
                      className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                        {coverUrl ? (
                          <Image
                            src={coverUrl}
                            alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <Car className="size-16 text-muted-foreground/20" />
                          </div>
                        )}
                        {/* Price overlay */}
                        <div className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm">
                          <p className="text-lg font-extrabold text-foreground">
                            ${vehicle.price.toLocaleString("en-US")}
                          </p>
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {vehicle.brand} {vehicle.model} {vehicle.year}
                        </h3>

                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {vehicle.mileage != null && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
                              <Gauge className="size-3" />
                              {vehicle.mileage.toLocaleString()} km
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
                            <Cog className="size-3" />
                            {TRANSMISSION_LABELS[vehicle.transmission]}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
                            <Fuel className="size-3" />
                            {FUEL_LABELS[vehicle.fuel]}
                          </span>
                        </div>
                        {vehicleBadges.length > 0 && (
                          <div className="mt-2">
                            <TrustBadges badges={vehicleBadges} compact />
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* =================== BENEFITS =================== */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">Ventajas</p>
              <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
                Todo lo que necesitas para vender
              </h2>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Brain,
                  title: "IA de precios",
                  description: "Nuestro sistema analiza el mercado y te sugiere el precio ideal para tu vehículo.",
                  color: "text-purple-600 bg-purple-100",
                },
                {
                  icon: QrCode,
                  title: "QR físico profesional",
                  description: "Vinil de alta calidad resistente al sol y la lluvia. Los compradores escanean desde la calle.",
                  color: "text-primary bg-primary/10",
                },
                {
                  icon: BarChart3,
                  title: "Analytics en tiempo real",
                  description: "Ve cuántas personas ven tu carro, escanean el QR y te contactan.",
                  color: "text-accent bg-accent/10",
                },
                {
                  icon: Megaphone,
                  title: "Publicidad automática",
                  description: "Tu vehículo aparece en la vitrina digital. Próximamente: ads automáticos en Meta.",
                  color: "text-orange-600 bg-orange-100",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-border bg-white p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className={`inline-flex rounded-xl p-3 ${item.color}`}>
                    <item.icon className="size-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =================== PRICING =================== */}
        <section id="precios" className="bg-secondary/50 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">Precio simple</p>
              <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
                Un pago, todo incluido
              </h2>
              <p className="mt-3 text-muted-foreground">
                Sin suscripciones, sin comisiones, sin costos ocultos
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-md">
              <div className="relative overflow-hidden rounded-3xl border-2 border-accent bg-white shadow-2xl shadow-accent/10">
                {/* Badge */}
                <div className="absolute right-4 top-4">
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                    Precio de lanzamiento
                  </span>
                </div>

                <div className="p-8 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Publicación de vehículo</p>
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className="text-6xl font-extrabold tracking-tight text-foreground">${PUBLICATION_PRICE_USD}</span>
                    <span className="text-lg text-muted-foreground">USD</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Pago único · 60 días de publicación</p>
                </div>

                <div className="border-t border-border px-8 py-6">
                  <ul className="space-y-3">
                    {[
                      "Tarjeta digital profesional",
                      "Vinil QR resistente al sol y lluvia",
                      "Hasta 15 fotos + video",
                      "Contacto directo por WhatsApp",
                      "Analytics de visitas y escaneos",
                      "Recomendación de precio con IA",
                      "Entrega a domicilio del QR",
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
                        <CheckCircle2 className="size-4 shrink-0 text-accent" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="px-8 pb-8">
                  <Link
                    href="/register"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-accent/90 hover:shadow-xl"
                  >
                    Comenzar ahora
                    <ArrowRight className="size-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================== SOCIAL PROOF =================== */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-8 rounded-3xl bg-gradient-to-br from-[#1B4F72] to-[#2E86C1] p-8 text-white sm:grid-cols-2 sm:p-12 lg:grid-cols-4">
              {[
                { value: `${totalVehicles || 0}+`, label: "Vehículos publicados", icon: Car },
                { value: `${totalViews || 0}+`, label: "Visitas totales", icon: Eye },
                { value: "3", label: "Ciudades activas", icon: MapPin },
                { value: "24/7", label: "Tu vitrina online", icon: Shield },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="mx-auto size-8 text-accent" />
                  <p className="mt-3 text-3xl font-extrabold sm:text-4xl">{stat.value}</p>
                  <p className="mt-1 text-sm text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =================== ALERTS PROMO =================== */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B4F72] to-[#2E86C1] p-8 sm:p-12">
              <div className="flex flex-col items-center gap-8 text-center md:flex-row md:text-left">
                <div className="flex-1">
                  <p className="text-sm font-semibold uppercase tracking-widest text-accent">Para compradores</p>
                  <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
                    Alertas Inteligentes
                  </h2>
                  <p className="mt-4 max-w-lg text-lg leading-relaxed text-white/75">
                    Define el carro que buscas y recibe una notificación por email apenas se publique uno que coincida.
                    Sin tener que revisar el catálogo todos los días.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3 justify-center md:justify-start">
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-accent/90"
                    >
                      <Bell className="size-4" />
                      Crear mi primera alerta
                    </Link>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-left">
                  {[
                    { label: "Marca y modelo", desc: "Toyota Corolla, Fortuner..." },
                    { label: "Rango de precio", desc: "$5,000 - $15,000" },
                    { label: "Año", desc: "2015 - 2020" },
                    { label: "Transmisión", desc: "Automática o manual" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                      <p className="text-sm font-bold text-white">{item.label}</p>
                      <p className="mt-0.5 text-xs text-white/60">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================== FINAL CTA =================== */}
        <section className="bg-secondary/50 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              ¿Listo para vender tu carro?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Únete a la plataforma que convierte tu carro en una vitrina digital.
              En minutos tendrás tu publicación activa.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-4 text-lg font-bold text-white shadow-xl shadow-accent/25 transition-all hover:bg-accent/90 hover:shadow-2xl"
            >
              Publicar mi carro por ${PUBLICATION_PRICE_USD}
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
