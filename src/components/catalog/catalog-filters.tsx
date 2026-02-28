"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VEHICLE_BRANDS, MAIN_CITIES, MIN_YEAR, MAX_YEAR } from "@/lib/constants";

const TRANSMISSION_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "automatic", label: "Automática" },
  { value: "manual", label: "Manual" },
  { value: "cvt", label: "CVT" },
] as const;

const FUEL_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "gasoline", label: "Gasolina" },
  { value: "diesel", label: "Diésel" },
  { value: "electric", label: "Eléctrico" },
  { value: "hybrid", label: "Híbrido" },
  { value: "gas", label: "Gas" },
] as const;

function FilterForm({ onApply }: { onApply?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [brand, setBrand] = useState(searchParams.get("brand") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [yearMin, setYearMin] = useState(searchParams.get("yearMin") || "");
  const [yearMax, setYearMax] = useState(searchParams.get("yearMax") || "");
  const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") || "");
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") || "");
  const [transmission, setTransmission] = useState(searchParams.get("transmission") || "");
  const [fuel, setFuel] = useState(searchParams.get("fuel") || "");
  const [q, setQ] = useState(searchParams.get("q") || "");

  function applyFilters() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (brand) params.set("brand", brand);
    if (city) params.set("city", city);
    if (yearMin) params.set("yearMin", yearMin);
    if (yearMax) params.set("yearMax", yearMax);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    if (transmission) params.set("transmission", transmission);
    if (fuel) params.set("fuel", fuel);
    // Preserve sort
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);

    router.push(`/catalogo?${params.toString()}`);
    onApply?.();
  }

  function clearFilters() {
    setBrand("");
    setCity("");
    setYearMin("");
    setYearMax("");
    setPriceMin("");
    setPriceMax("");
    setTransmission("");
    setFuel("");
    setQ("");
    router.push("/catalogo");
    onApply?.();
  }

  const hasFilters = brand || city || yearMin || yearMax || priceMin || priceMax || transmission || fuel || q;

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Buscar
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ej: Corolla 2020"
            className="pl-9"
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </div>
      </div>

      {/* Brand */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Marca
        </Label>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Todas las marcas</option>
          {VEHICLE_BRANDS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* City */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ciudad
        </Label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Todas las ciudades</option>
          {MAIN_CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Year range */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Año
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            value={yearMin}
            onChange={(e) => setYearMin(e.target.value)}
            placeholder={`Desde ${MIN_YEAR}`}
            min={MIN_YEAR}
            max={MAX_YEAR}
          />
          <Input
            type="number"
            value={yearMax}
            onChange={(e) => setYearMax(e.target.value)}
            placeholder={`Hasta ${MAX_YEAR}`}
            min={MIN_YEAR}
            max={MAX_YEAR}
          />
        </div>
      </div>

      {/* Price range */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Precio (USD)
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder="Mín"
            min={0}
          />
          <Input
            type="number"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder="Máx"
            min={0}
          />
        </div>
      </div>

      {/* Transmission */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Transmisión
        </Label>
        <select
          value={transmission}
          onChange={(e) => setTransmission(e.target.value)}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {TRANSMISSION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Fuel */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Combustible
        </Label>
        <select
          value={fuel}
          onChange={(e) => setFuel(e.target.value)}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {FUEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-2">
        <Button onClick={applyFilters} className="flex-1 bg-accent text-white hover:bg-accent/90">
          Aplicar filtros
        </Button>
        {hasFilters && (
          <Button variant="outline" onClick={clearFilters} className="shrink-0">
            <X className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function CatalogFilters() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-20 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Filtros
          </h2>
          <FilterForm />
        </div>
      </aside>

      {/* Mobile filter button + sheet */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="size-4" />
              Filtros
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterForm onApply={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
