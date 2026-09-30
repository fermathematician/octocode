import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { DisconnectGoogleService } from "../services/DisconnectGoogleService.js";

export class DisconnectGoogleController {
  constructor(private readonly service: DisconnectGoogleService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    await this.service.execute(request.auth.userId);
    response.status(204).end();
  };
}
