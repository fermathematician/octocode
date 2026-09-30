import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { UpdateStoryService } from "../services/UpdateStoryService.js";
import type { StoryParams } from "../types.js";
import type { UpdateStoryInput } from "../validation/story.schema.js";

export class UpdateStoryController {
  constructor(private readonly service: UpdateStoryService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { storyId } = request.validated?.params as StoryParams;
    const input = request.validated?.body as UpdateStoryInput;
    const story = await this.service.execute(
      request.auth.userId,
      storyId,
      input,
    );
    response.json(story);
  };
}
