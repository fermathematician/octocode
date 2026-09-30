import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { ListRepositoriesService } from "../services/ListRepositoriesService.js";

export class ListRepositoriesController {
  constructor(private readonly service: ListRepositoriesService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const repositories = await this.service.execute(request.auth.userId);
    response.json(repositories);
  };
}
