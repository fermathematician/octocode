import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { CreateStoryService } from "../services/CreateStoryService.js";
import type { CreateStoryInput } from "../validation/story.schema.js";

export class CreateStoryController {
  constructor(private readonly service: CreateStoryService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const input = request.validated?.body as CreateStoryInput;
    const story = await this.service.execute(request.auth.userId, input);
    response.status(201).json(story);
  };
}
