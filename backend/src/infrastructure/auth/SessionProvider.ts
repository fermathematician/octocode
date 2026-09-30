import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "../../generated/prisma/client.js";

export interface SessionContext {
  userId: string;
}

export interface CreatedSession {
  token: string;
  expiresAt: Date;
}

export class SessionProvider {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ttlDays: number,
  ) {}

  private hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  async create(
    userId: string,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<CreatedSession> {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + this.ttlDays * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId,
        tokenHash: this.hash(token),
        expiresAt,
        userAgent: meta.userAgent ?? null,
        ipAddress: meta.ipAddress ?? null,
      },
    });

    return { token, expiresAt };
  }

  async findValid(token: string): Promise<SessionContext | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: this.hash(token) },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      return null;
    }

    return { userId: session.userId };
  }

  async revoke(token: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { tokenHash: this.hash(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
