import type { RequestHandler } from "express";

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

export function createRateLimiter({
  windowMs,
  max,
}: RateLimitOptions): RequestHandler {
  const buckets = new Map<string, Bucket>();

  const prune = () => {
    const now = Date.now();

    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
  };

  const timer = setInterval(prune, windowMs);
  timer.unref();

  return (request, response, next) => {
    const key = request.ip ?? "unknown";
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (bucket.count >= max) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((bucket.resetAt - now) / 1000),
      );
      response.setHeader("Retry-After", String(retryAfterSeconds));
      response
        .status(429)
        .json({ message: "Too many requests. Please try again later." });
      return;
    }

    bucket.count += 1;
    next();
  };
}
