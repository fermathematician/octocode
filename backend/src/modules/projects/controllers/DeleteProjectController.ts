import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { DeleteProjectService } from "../services/DeleteProjectService.js";

export class DeleteProjectController {
  constructor(private readonly service: DeleteProjectService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { projectId } = request.validated?.params as { projectId: string };
    await this.service.execute(request.auth.userId, projectId);
    response.status(204).end();
  };
}
