/**
 * Simple in-memory rate limiter. Suitable for single-instance deployments.
 * Each window is keyed by `${prefix}:${ip}`.
 */

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

// Prune expired entries every 5 minutes to avoid unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [key, win] of store) {
    if (win.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * @param prefix  Logical bucket name (e.g. "send-sms")
 * @param ip      Client IP address
 * @param limit   Max requests allowed per window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(
  prefix: string,
  ip: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const key = `${prefix}:${ip}`;
  const now = Date.now();
  let win = store.get(key);

  if (!win || win.resetAt < now) {
    win = { count: 0, resetAt: now + windowMs };
    store.set(key, win);
  }

  win.count++;

  return {
    allowed: win.count <= limit,
    remaining: Math.max(0, limit - win.count),
    resetAt: win.resetAt,
  };
}

/** Extract the best-guess client IP from a Next.js request. */
export function getClientIp(req: Request): string {
  const headers = new Headers((req as Request).headers);
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
