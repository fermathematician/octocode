import type {
  OAuthAccount,
  OAuthProvider,
  PrismaClient,
} from "../../../generated/prisma/client.js";

export interface OAuthAccountRecord {
  id: string;
  userId: string;
  provider: OAuthProvider;
  providerAccountId: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
}

export interface SaveOAuthAccountData {
  userId: string;
  provider: OAuthProvider;
  providerAccountId: string;
  accessToken: string;
  refreshToken: string | null;
  tokenType: string | null;
  scope: string;
  expiresAt: Date | null;
}

export interface OAuthAccountRepository {
  findByProviderAccount(
    provider: OAuthProvider,
    providerAccountId: string,
  ): Promise<OAuthAccountRecord | null>;
  findByUser(
    userId: string,
    provider: OAuthProvider,
  ): Promise<OAuthAccountRecord | null>;
  save(data: SaveOAuthAccountData): Promise<OAuthAccount>;
}

export class PrismaOAuthAccountRepository implements OAuthAccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByProviderAccount(
    provider: OAuthProvider,
    providerAccountId: string,
  ): Promise<OAuthAccountRecord | null> {
    const account = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
    });

    return account ? toRecord(account) : null;
  }

  async findByUser(
    userId: string,
    provider: OAuthProvider,
  ): Promise<OAuthAccountRecord | null> {
    const account = await this.prisma.oAuthAccount.findFirst({
      where: { userId, provider },
    });

    return account ? toRecord(account) : null;
  }

  save(data: SaveOAuthAccountData): Promise<OAuthAccount> {
    return this.prisma.oAuthAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: data.provider,
          providerAccountId: data.providerAccountId,
        },
      },
      create: data,
      update: {
        userId: data.userId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenType: data.tokenType,
        scope: data.scope,
        expiresAt: data.expiresAt,
      },
    });
  }
}

function toRecord(account: OAuthAccount): OAuthAccountRecord {
  return {
    id: account.id,
    userId: account.userId,
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    accessToken: account.accessToken,
    refreshToken: account.refreshToken,
    expiresAt: account.expiresAt,
  };
}
