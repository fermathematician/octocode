import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { GetDebugOverviewService } from "../services/GetDebugOverviewService.js";

export class GetDebugOverviewController {
  constructor(private readonly service: GetDebugOverviewService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const overview = await this.service.execute(request.auth.userId);
    response.json(overview);
  };
}
