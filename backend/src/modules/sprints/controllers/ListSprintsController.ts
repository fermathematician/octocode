import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { ListSprintsService } from "../services/ListSprintsService.js";

export class ListSprintsController {
  constructor(private readonly service: ListSprintsService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { projectId } = request.validated?.query as { projectId?: string };
    const sprints = await this.service.execute(request.auth.userId, projectId);
    response.json(sprints);
  };
}
