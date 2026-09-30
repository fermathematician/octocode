import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { ListProjectsService } from "../services/ListProjectsService.js";

export class ListProjectsController {
  constructor(private readonly service: ListProjectsService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const projects = await this.service.execute(request.auth.userId);
    response.json(projects);
  };
}
