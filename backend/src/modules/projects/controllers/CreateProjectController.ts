import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { CreateProjectService } from "../services/CreateProjectService.js";
import type { CreateProjectInput } from "../validation/project.schema.js";

export class CreateProjectController {
  constructor(private readonly service: CreateProjectService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const input = request.validated?.body as CreateProjectInput;
    const project = await this.service.execute(request.auth.userId, input);
    response.status(201).json(project);
  };
}
