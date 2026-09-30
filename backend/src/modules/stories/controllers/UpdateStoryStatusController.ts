import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { UpdateStoryStatusService } from "../services/UpdateStoryStatusService.js";
import type { StoryParams } from "../types.js";
import type { UpdateStoryStatusInput } from "../validation/story.schema.js";

export class UpdateStoryStatusController {
  constructor(private readonly service: UpdateStoryStatusService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { storyId } = request.validated?.params as StoryParams;
    const { status } = request.validated?.body as UpdateStoryStatusInput;
    const story = await this.service.execute(
      request.auth.userId,
      storyId,
      status,
    );
    response.json(story);
  };
}
