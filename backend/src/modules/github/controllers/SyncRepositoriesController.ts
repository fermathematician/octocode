import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { SyncRepositoriesService } from "../services/SyncRepositoriesService.js";

export class SyncRepositoriesController {
  constructor(private readonly service: SyncRepositoriesService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const result = await this.service.executeForUser(request.auth.userId);
    response.json(result);
  };
}
