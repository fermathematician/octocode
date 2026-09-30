import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { ListCalendarEventsService } from "../services/ListCalendarEventsService.js";

export class ListCalendarEventsController {
  constructor(private readonly service: ListCalendarEventsService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { date } = (request.validated?.query ?? {}) as { date?: string };
    const events = await this.service.execute(request.auth.userId, date);
    response.json(events);
  };
}
