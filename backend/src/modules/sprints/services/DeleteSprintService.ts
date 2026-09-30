import { AppError } from "../../../shared/appError.js";
import type { SprintRepository } from "../repositories/SprintRepository.js";

export class DeleteSprintService {
  constructor(private readonly sprints: SprintRepository) {}

  async execute(ownerId: string, sprintId: string): Promise<void> {
    const deleted = await this.sprints.delete(sprintId, ownerId);

    if (!deleted) {
      throw new AppError("Sprint not found", 404);
    }
  }
}
