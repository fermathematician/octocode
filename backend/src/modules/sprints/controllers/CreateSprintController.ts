import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { CreateSprintService } from "../services/CreateSprintService.js";
import type { CreateSprintInput } from "../validation/sprint.schema.js";

export class CreateSprintController {
  constructor(private readonly service: CreateSprintService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const input = request.validated?.body as CreateSprintInput;
    const sprint = await this.service.execute(request.auth.userId, input);
    response.status(201).json(sprint);
  };
}
