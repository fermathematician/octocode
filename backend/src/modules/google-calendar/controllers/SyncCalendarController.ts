import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { SyncCalendarService } from "../services/SyncCalendarService.js";

export class SyncCalendarController {
  constructor(private readonly service: SyncCalendarService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const result = await this.service.execute(request.auth.userId);
    response.json({
      pulled: result.pulled,
      pushed: result.pushed,
      deleted: result.deleted,
      lastSyncedAt: result.lastSyncedAt.toISOString(),
    });
  };
}
