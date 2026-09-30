import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { AssignStoryBranchService } from "../services/AssignStoryBranchService.js";
import type { StoryParams } from "../types.js";
import type { AssignStoryBranchInput } from "../validation/story.schema.js";

export class AssignStoryBranchController {
  constructor(private readonly service: AssignStoryBranchService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { storyId } = request.validated?.params as StoryParams;
    const { branch } = request.validated?.body as AssignStoryBranchInput;
    const story = await this.service.execute(
      request.auth.userId,
      storyId,
      branch,
    );
    response.json(story);
  };
}
