import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { LinkRepositoryService } from "../services/LinkRepositoryService.js";
import type { LinkRepositoryInput } from "../validation/github.schema.js";

export class LinkRepositoryController {
  constructor(private readonly service: LinkRepositoryService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const input = request.validated?.body as LinkRepositoryInput;
    const repository = await this.service.execute(request.auth.userId, input);
    response.json(repository);
  };
}
