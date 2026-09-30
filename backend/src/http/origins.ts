import { env } from "../config/env.js";

const LOCAL_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/**
 * Allowed browser origins. The configured `CORS_ORIGIN` is always allowed; in
 * non-production any localhost/127.0.0.1 port is allowed too, so a dev server on
 * a different port (e.g. Vite on 5174) does not silently break requests.
 */
export function isAllowedOrigin(origin: string): boolean {
  if (origin === env.corsOrigin) {
    return true;
  }

  return !env.isProduction && LOCAL_ORIGIN_PATTERN.test(origin);
}
