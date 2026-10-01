import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { SyncCommitsService } from "../services/SyncCommitsService.js";

export class SyncCommitsController {
  constructor(private readonly service: SyncCommitsService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const result = await this.service.executeForUser(request.auth.userId);
    response.json({ stories: result.stories, commits: result.commits });
  };
}
