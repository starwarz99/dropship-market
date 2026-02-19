import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies the HMAC-SHA256 signature of an incoming webhook request.
 * The signature is expected in the `x-webhook-signature` header.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expected = createHmac("sha256", secret).update(body).digest("hex");
    const expectedBuf = Buffer.from(`sha256=${expected}`, "utf8");
    const signatureBuf = Buffer.from(signature, "utf8");

    if (expectedBuf.length !== signatureBuf.length) return false;
    return timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
}
