import { createAdminClient } from "@/lib/supabase/admin";
import { BCV_RATE_FALLBACK } from "@/lib/constants";

const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

interface PyDolarVeResponse {
  monitors: {
    bcv: {
      price: number;
      last_update: string;
    };
  };
}

/**
 * Fetch the current BCV (Banco Central de Venezuela) USD/VES rate.
 * Strategy: API → cached DB value → hardcoded fallback
 */
export async function getBcvRate(): Promise<number> {
  // 1. Try fetching from pydolarve API
  try {
    const res = await fetch("https://pydolarve.org/api/v2/dollar?monitor=bcv", {
      next: { revalidate: CACHE_DURATION_MS / 1000 },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = (await res.json()) as PyDolarVeResponse;
      const rate = data.monitors?.bcv?.price;

      if (rate && rate > 0) {
        // Cache in DB
        await cacheBcvRate(rate, "pydolarve");
        return rate;
      }
    }
  } catch (err) {
    console.warn("BCV rate API fetch failed:", err);
  }

  // 2. Try cached value from DB (within 24h)
  try {
    const supabase = createAdminClient();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from("bcv_rates")
      .select("rate")
      .gt("fetched_at", oneDayAgo)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .single();

    if (data?.rate) {
      return Number(data.rate);
    }
  } catch {
    console.warn("BCV rate DB cache miss");
  }

  // 3. Hardcoded fallback
  return BCV_RATE_FALLBACK;
}

async function cacheBcvRate(rate: number, source: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("bcv_rates").insert({
      rate,
      source,
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Failed to cache BCV rate:", err);
  }
}
