import { FileCheck, Camera, Sparkles, ShieldCheck } from "lucide-react";
import type { TrustBadge } from "@/lib/trust-badges";

const ICON_MAP = {
  FileCheck,
  Camera,
  Sparkles,
  ShieldCheck,
} as const;

const COLOR_CLASSES: Record<TrustBadge["color"], string> = {
  green: "bg-green-100 text-green-700 border-green-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
};

interface TrustBadgesProps {
  badges: TrustBadge[];
  compact?: boolean;
}

export function TrustBadges({ badges, compact = false }: TrustBadgesProps) {
  if (badges.length === 0) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {badges.map((badge) => {
          const Icon = ICON_MAP[badge.icon];
          return (
            <span
              key={badge.id}
              title={badge.label}
              className={`inline-flex items-center rounded-md border px-1.5 py-0.5 ${COLOR_CLASSES[badge.color]}`}
            >
              <Icon className="size-3" />
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge) => {
        const Icon = ICON_MAP[badge.icon];
        return (
          <span
            key={badge.id}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${COLOR_CLASSES[badge.color]}`}
          >
            <Icon className="size-3.5" />
            {badge.label}
          </span>
        );
      })}
    </div>
  );
}
