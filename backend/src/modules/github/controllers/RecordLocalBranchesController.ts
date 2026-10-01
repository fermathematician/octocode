import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { RecordLocalBranchesInput } from "../validation/github.schema.js";
import type { RecordLocalBranchesService } from "../services/RecordLocalBranchesService.js";

export class RecordLocalBranchesController {
  constructor(private readonly service: RecordLocalBranchesService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const body = request.validated?.body as RecordLocalBranchesInput;
    const result = await this.service.execute(request.auth.userId, body);
    response.status(200).json(result);
  };
}
