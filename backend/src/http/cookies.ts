export function parseCookies(
  header: string | undefined,
): Record<string, string> {
  if (!header) {
    return {};
  }

  const cookies: Record<string, string> = {};

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();

    if (name) {
      cookies[name] = decodeURIComponent(value);
    }
  }

  return cookies;
}

interface CookieOptions {
  maxAgeSeconds?: number;
  secure: boolean;
}

export function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions,
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (options.maxAgeSeconds !== undefined) {
    parts.push(`Max-Age=${options.maxAgeSeconds}`);
  }

  if (options.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function clearCookie(name: string, secure: boolean): string {
  return serializeCookie(name, "", { maxAgeSeconds: 0, secure });
}
