import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { SyncStoryCommitsService } from "../services/SyncStoryCommitsService.js";

export class SyncStoryCommitsController {
  constructor(private readonly service: SyncStoryCommitsService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { storyId } = request.validated?.params as { storyId: string };
    const result = await this.service.execute(request.auth.userId, storyId);
    response.json(result);
  };
}
