import type { Context, Next } from 'hono';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function createRateLimit(options: { limit: number; windowMs: number; keyPrefix: string }) {
  return async function rateLimit(c: Context, next: Next) {
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      'unknown';
    const key = `${options.keyPrefix}:${ip}`;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > options.limit) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json(
        { error: { code: 'RATE_LIMITED', message: 'Muitas tentativas. Tente novamente mais tarde.' } },
        429,
      );
    }
    await next();
  };
}

export function resetRateLimitsForTests(): void {
  buckets.clear();
}
