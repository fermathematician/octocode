import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { Pagination } from "../../../shared/pagination.js";
import type { StoryFilters } from "../repositories/StoryRepository.js";
import type { ListStoriesService } from "../services/ListStoriesService.js";

export class ListStoriesController {
  constructor(private readonly service: ListStoriesService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { filters, pagination } = request.validated?.query as {
      filters: StoryFilters;
      pagination: Pagination;
    };
    const page = await this.service.execute(
      request.auth.userId,
      filters,
      pagination,
    );
    response.json(page);
  };
}
