import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { Pagination } from "../../../shared/pagination.js";
import type { ListSprintsService } from "../services/ListSprintsService.js";

export class ListSprintsController {
  constructor(private readonly service: ListSprintsService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { pagination } = request.validated?.query as {
      pagination: Pagination;
    };
    const page = await this.service.execute(request.auth.userId, pagination);
    response.json(page);
  };
}
