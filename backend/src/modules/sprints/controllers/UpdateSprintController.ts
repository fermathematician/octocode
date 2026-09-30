import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { UpdateSprintService } from "../services/UpdateSprintService.js";
import type { UpdateSprintInput } from "../validation/sprint.schema.js";

export class UpdateSprintController {
  constructor(private readonly service: UpdateSprintService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { sprintId } = request.validated?.params as { sprintId: string };
    const input = request.validated?.body as UpdateSprintInput;
    const sprint = await this.service.execute(
      request.auth.userId,
      sprintId,
      input,
    );
    response.json(sprint);
  };
}
