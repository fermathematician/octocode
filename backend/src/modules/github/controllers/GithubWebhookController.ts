import type { Request, Response } from "express";
import type { HandleGithubWebhookService } from "../services/HandleGithubWebhookService.js";

export class GithubWebhookController {
  constructor(private readonly service: HandleGithubWebhookService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    await this.service.execute({
      event: readHeader(request, "x-github-event"),
      deliveryId: readHeader(request, "x-github-delivery"),
      signature: readHeader(request, "x-hub-signature-256"),
      rawBody: request.rawBody,
      payload: request.body,
    });

    response.status(202).json({ received: true });
  };
}

function readHeader(request: Request, name: string): string | undefined {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : value;
}
