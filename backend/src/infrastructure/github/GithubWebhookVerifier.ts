import { createHmac, timingSafeEqual } from "node:crypto";

/** Verifies the `X-Hub-Signature-256` header GitHub sends with webhook deliveries. */
export function verifyGithubWebhookSignature(
  secret: string,
  payload: Buffer,
  signature: string | undefined,
): boolean {
  if (!signature) {
    return false;
  }

  const expected = `sha256=${createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`;

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}
