import {
  Prisma,
  type PrismaClient,
} from "../../../generated/prisma/client.js";

export interface GithubWebhookEventRepository {
  /** Returns true when the delivery is new, false when it was already recorded. */
  record(deliveryId: string, event: string): Promise<boolean>;
}

export class PrismaGithubWebhookEventRepository
  implements GithubWebhookEventRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async record(deliveryId: string, event: string): Promise<boolean> {
    try {
      await this.prisma.githubWebhookEvent.create({
        data: { deliveryId, event, processedAt: new Date() },
      });

      return true;
    } catch (error) {
      // Duplicate delivery: already handled.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return false;
      }

      throw error;
    }
  }
}
