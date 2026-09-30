import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { Pagination } from "../../../shared/pagination.js";
import type { ListCalendarEventsService } from "../services/ListCalendarEventsService.js";

export class ListCalendarEventsController {
  constructor(private readonly service: ListCalendarEventsService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { date, pagination } = request.validated?.query as {
      date?: string;
      pagination: Pagination;
    };
    const page = await this.service.execute(
      request.auth.userId,
      date,
      pagination,
    );
    response.json(page);
  };
}
