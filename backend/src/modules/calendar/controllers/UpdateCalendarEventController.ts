import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { UpdateCalendarEventService } from "../services/UpdateCalendarEventService.js";
import type { UpdateCalendarEventInput } from "../validation/calendar.schema.js";

export class UpdateCalendarEventController {
  constructor(private readonly service: UpdateCalendarEventService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { eventId } = request.validated?.params as { eventId: string };
    const input = request.validated?.body as UpdateCalendarEventInput;
    const event = await this.service.execute(
      request.auth.userId,
      eventId,
      input,
    );
    response.json(event);
  };
}
