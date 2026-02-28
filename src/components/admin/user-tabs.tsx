"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { canCreateUsers } from "@/lib/permissions";
import { CreateUserDialog } from "./create-user-dialog";
import type { UserRole } from "@/types";

export type UserTab = "team" | "sellers";

interface Props {
  activeTab: UserTab;
  query: string;
  userRole: UserRole;
}

export function UserTabs({ activeTab, query, userRole }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const navigate = useCallback(
    (tab: UserTab, q?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      if (q !== undefined) {
        if (q) {
          params.set("q", q);
        } else {
          params.delete("q");
        }
      }
      startTransition(() => {
        router.push(`/admin/users?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition]
  );

  const showCreateButton = activeTab === "team" && canCreateUsers(userRole);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
          <button
            onClick={() => navigate("team", query)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "team"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Equipo
          </button>
          <button
            onClick={() => navigate("sellers", query)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "sellers"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Vendedores
          </button>
        </div>

        {/* Create button */}
        {showCreateButton && <CreateUserDialog />}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o email..."
          defaultValue={query}
          onChange={(e) => {
            const timeout = setTimeout(() => {
              navigate(activeTab, e.target.value);
            }, 300);
            return () => clearTimeout(timeout);
          }}
          className="pl-9"
        />
      </div>
    </div>
  );
}
