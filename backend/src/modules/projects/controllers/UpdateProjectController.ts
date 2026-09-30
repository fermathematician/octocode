import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { UpdateProjectService } from "../services/UpdateProjectService.js";
import type { UpdateProjectInput } from "../validation/project.schema.js";

export class UpdateProjectController {
  constructor(private readonly service: UpdateProjectService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { projectId } = request.validated?.params as { projectId: string };
    const input = request.validated?.body as UpdateProjectInput;
    const project = await this.service.execute(
      request.auth.userId,
      projectId,
      input,
    );
    response.json(project);
  };
}
