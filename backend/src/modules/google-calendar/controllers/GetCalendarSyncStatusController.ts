import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { GetCalendarSyncStatusService } from "../services/GetCalendarSyncStatusService.js";

export class GetCalendarSyncStatusController {
  constructor(private readonly service: GetCalendarSyncStatusService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const status = await this.service.execute(request.auth.userId);
    response.json(status);
  };
}
