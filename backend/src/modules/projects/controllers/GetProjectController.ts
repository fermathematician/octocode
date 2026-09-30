import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { GetProjectService } from "../services/GetProjectService.js";
import type { GetProjectParams } from "../types.js";

export class GetProjectController {
  constructor(private readonly service: GetProjectService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { projectId } = request.validated?.params as GetProjectParams;
    const project = await this.service.execute(request.auth.userId, projectId);
    response.json(project);
  };
}
