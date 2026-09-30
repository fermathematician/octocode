import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { DeleteCalendarEventService } from "../services/DeleteCalendarEventService.js";

export class DeleteCalendarEventController {
  constructor(private readonly service: DeleteCalendarEventService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { eventId } = request.validated?.params as { eventId: string };
    await this.service.execute(request.auth.userId, eventId);
    response.status(204).end();
  };
}
