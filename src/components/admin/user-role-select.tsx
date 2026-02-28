"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updateUserRole } from "@/lib/actions/admin";
import { ROLE_LABELS, ROLE_BADGE_COLORS } from "@/lib/permissions";
import type { UserRole } from "@/types";

interface Props {
  userId: string;
  currentRole: UserRole;
}

const ALL_ROLES: UserRole[] = [
  "seller",
  "admin",
  "analyst",
  "moderator",
  "printer",
  "courier",
  "support",
];

export function UserRoleSelect({ userId, currentRole }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const badgeColor = ROLE_BADGE_COLORS[currentRole] || ROLE_BADGE_COLORS.seller;

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as UserRole;
    if (newRole === currentRole) return;

    setLoading(true);
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      router.refresh();
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        Cambiando...
      </span>
    );
  }

  return (
    <select
      value={currentRole}
      onChange={handleChange}
      className={`cursor-pointer rounded-full border px-2 py-0.5 text-[11px] font-medium ${badgeColor}`}
    >
      {ALL_ROLES.map((role) => (
        <option key={role} value={role}>
          {ROLE_LABELS[role]}
        </option>
      ))}
    </select>
  );
}
