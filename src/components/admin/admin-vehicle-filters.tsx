"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  currentStatus?: string;
  currentQuery?: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "pending_review", label: "En revisión" },
  { value: "sold", label: "Vendidos" },
  { value: "expired", label: "Vencidos" },
  { value: "rejected", label: "Rechazados" },
];

export function AdminVehicleFilters({ currentStatus, currentQuery }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/admin/vehicles?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por marca o modelo..."
          defaultValue={currentQuery || ""}
          className="pl-9"
          onChange={(e) => {
            const value = e.target.value;
            // Debounce: update after user stops typing
            const timeout = setTimeout(() => updateParams("q", value), 400);
            return () => clearTimeout(timeout);
          }}
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 overflow-x-auto">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateParams("status", opt.value)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              (currentStatus || "") === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
