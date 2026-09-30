import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { StoryFilters } from "../repositories/StoryRepository.js";
import type { ListStoriesService } from "../services/ListStoriesService.js";

export class ListStoriesController {
  constructor(private readonly service: ListStoriesService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const filters = (request.validated?.query ?? {}) as StoryFilters;
    const stories = await this.service.execute(request.auth.userId, filters);
    response.json(stories);
  };
}
