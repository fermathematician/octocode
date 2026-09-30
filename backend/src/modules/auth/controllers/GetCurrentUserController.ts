import type { Request, Response } from "express";
import { AppError } from "../../../shared/appError.js";
import type { GetCurrentUserService } from "../services/GetCurrentUserService.js";

export class GetCurrentUserController {
  constructor(private readonly service: GetCurrentUserService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const user = await this.service.execute(request.auth.userId);
    response.json(user);
  };
}
