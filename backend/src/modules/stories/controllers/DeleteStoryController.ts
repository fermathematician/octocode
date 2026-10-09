import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { DeleteStoryService } from "../services/DeleteStoryService.js";
import type { StoryParams } from "../types.js";

export class DeleteStoryController {
  constructor(private readonly service: DeleteStoryService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { storyId } = request.validated?.params as StoryParams;
    await this.service.execute(request.auth.userId, storyId);
    response.status(204).end();
  };
}
