import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { CreateProjectFromRepositoryService } from "../services/CreateProjectFromRepositoryService.js";
import type { CreateProjectFromRepositoryInput } from "../validation/project.schema.js";

export class CreateProjectFromRepositoryController {
  constructor(private readonly service: CreateProjectFromRepositoryService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const input = request.validated?.body as CreateProjectFromRepositoryInput;
    const project = await this.service.execute(request.auth.userId, input);
    response.status(201).json(project);
  };
}
