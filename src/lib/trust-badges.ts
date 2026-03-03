import type { Vehicle } from "@/types";

export type TrustBadgeId = "papers_verified" | "recent_photos" | "fair_price" | "verified_seller";

export interface TrustBadge {
  id: TrustBadgeId;
  label: string;
  icon: "FileCheck" | "Camera" | "Sparkles" | "ShieldCheck";
  color: "green" | "blue" | "purple" | "amber";
}

const BADGE_DEFINITIONS: Record<TrustBadgeId, Omit<TrustBadge, "id">> = {
  papers_verified: {
    label: "Papeles verificados",
    icon: "FileCheck",
    color: "green",
  },
  recent_photos: {
    label: "Fotos recientes",
    icon: "Camera",
    color: "blue",
  },
  fair_price: {
    label: "Precio justo IA",
    icon: "Sparkles",
    color: "purple",
  },
  verified_seller: {
    label: "Vendedor verificado",
    icon: "ShieldCheck",
    color: "amber",
  },
};

interface ComputeBadgesInput {
  vehicle: Pick<Vehicle, "conditions" | "price">;
  /** Most recent photo created_at ISO string for this vehicle */
  latestPhotoDate: string | null;
  /** AI price report market avg */
  aiMarketAvg: number | null;
  /** Whether the seller profile is_verified */
  sellerVerified: boolean;
}

export function computeTrustBadges(input: ComputeBadgesInput): TrustBadge[] {
  const badges: TrustBadge[] = [];

  // Papers verified
  if (input.vehicle.conditions?.papers_ok === true) {
    badges.push({ id: "papers_verified", ...BADGE_DEFINITIONS.papers_verified });
  }

  // Recent photos (< 7 days)
  if (input.latestPhotoDate) {
    const photoAge = Date.now() - new Date(input.latestPhotoDate).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (photoAge < sevenDays) {
      badges.push({ id: "recent_photos", ...BADGE_DEFINITIONS.recent_photos });
    }
  }

  // Fair price (within ±10% of AI average)
  if (input.aiMarketAvg != null && input.aiMarketAvg > 0) {
    const ratio = input.vehicle.price / input.aiMarketAvg;
    if (ratio >= 0.9 && ratio <= 1.1) {
      badges.push({ id: "fair_price", ...BADGE_DEFINITIONS.fair_price });
    }
  }

  // Verified seller
  if (input.sellerVerified) {
    badges.push({ id: "verified_seller", ...BADGE_DEFINITIONS.verified_seller });
  }

  return badges;
}

/**
 * Batch-compute trust badges for multiple vehicles.
 * Accepts pre-fetched maps to avoid N+1 queries.
 */
export function computeTrustBadgesBatch(
  vehicles: Pick<Vehicle, "id" | "conditions" | "price">[],
  latestPhotoDates: Map<string, string>,
  aiMarketAvgs: Map<string, number>,
  sellerVerifiedMap: Map<string, boolean>
): Map<string, TrustBadge[]> {
  const result = new Map<string, TrustBadge[]>();

  for (const vehicle of vehicles) {
    const badges = computeTrustBadges({
      vehicle,
      latestPhotoDate: latestPhotoDates.get(vehicle.id) ?? null,
      aiMarketAvg: aiMarketAvgs.get(vehicle.id) ?? null,
      sellerVerified: sellerVerifiedMap.get(vehicle.id) ?? false,
    });
    result.set(vehicle.id, badges);
  }

  return result;
}
