import { AppError } from "../../../shared/appError.js";
import type { ProjectRepository } from "../repositories/ProjectRepository.js";

export class DeleteProjectService {
  constructor(private readonly projects: ProjectRepository) {}

  async execute(ownerId: string, projectId: string): Promise<void> {
    const deleted = await this.projects.delete(projectId, ownerId);

    if (!deleted) {
      throw new AppError("Project not found", 404);
    }
  }
}
