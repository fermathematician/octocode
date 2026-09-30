import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { DeleteSprintService } from "../services/DeleteSprintService.js";

export class DeleteSprintController {
  constructor(private readonly service: DeleteSprintService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { sprintId } = request.validated?.params as { sprintId: string };
    await this.service.execute(request.auth.userId, sprintId);
    response.status(204).end();
  };
}
