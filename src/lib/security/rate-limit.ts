/**
 * Simple in-memory rate limiter for Server Actions.
 * In production with multiple instances, use Redis-based rate limiting.
 */
const rateMap = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateMap) {
    if (val.resetAt < now) {
      rateMap.delete(key);
    }
  }
}, 60_000);

interface RateLimitOptions {
  /** Maximum requests per window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { maxRequests: 10, windowMs: 60_000 }
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(identifier);

  if (!entry || entry.resetAt < now) {
    rateMap.set(identifier, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.maxRequests - 1 };
  }

  entry.count++;

  if (entry.count > options.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: options.maxRequests - entry.count };
}
