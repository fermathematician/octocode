import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { ListProjectBranchesService } from "../services/ListProjectBranchesService.js";

export class ListProjectBranchesController {
  constructor(private readonly service: ListProjectBranchesService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { projectId } = request.validated?.params as { projectId: string };
    const branches = await this.service.execute(request.auth.userId, projectId);
    response.json(branches);
  };
}
