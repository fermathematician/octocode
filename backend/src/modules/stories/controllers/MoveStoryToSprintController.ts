import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { MoveStoryToSprintService } from "../services/MoveStoryToSprintService.js";
import type { StoryParams } from "../types.js";
import type { MoveStorySprintInput } from "../validation/story.schema.js";

export class MoveStoryToSprintController {
  constructor(private readonly service: MoveStoryToSprintService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { storyId } = request.validated?.params as StoryParams;
    const { sprintId } = request.validated?.body as MoveStorySprintInput;
    const story = await this.service.execute(
      request.auth.userId,
      storyId,
      sprintId,
    );
    response.json(story);
  };
}
