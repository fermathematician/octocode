import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { CreateCalendarEventService } from "../services/CreateCalendarEventService.js";
import type { CreateCalendarEventInput } from "../validation/calendar.schema.js";

export class CreateCalendarEventController {
  constructor(private readonly service: CreateCalendarEventService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const input = request.validated?.body as CreateCalendarEventInput;
    const event = await this.service.execute(request.auth.userId, input);
    response.status(201).json(event);
  };
}
