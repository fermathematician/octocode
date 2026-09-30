import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

export class TokenCipher {
  private readonly key: Buffer;

  constructor(encodedKey: string) {
    const key = Buffer.from(encodedKey, "base64");

    if (key.length !== 32) {
      throw new Error(
        "TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.",
      );
    }

    this.key = key;
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [iv, authTag, encrypted]
      .map((buffer) => buffer.toString("base64"))
      .join(".");
  }

  decrypt(payload: string): string {
    const [ivPart, tagPart, dataPart] = payload.split(".");

    if (!ivPart || !tagPart || !dataPart) {
      throw new Error("Malformed ciphertext.");
    }

    const decipher = createDecipheriv(
      ALGORITHM,
      this.key,
      Buffer.from(ivPart, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tagPart, "base64"));

    return Buffer.concat([
      decipher.update(Buffer.from(dataPart, "base64")),
      decipher.final(),
    ]).toString("utf8");
  }
}
