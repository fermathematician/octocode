import { AppError } from "../../../shared/appError.js";
import { toProjectDto, type ProjectDto } from "../../../shared/presenters.js";
import type { ProjectRepository } from "../repositories/ProjectRepository.js";

export class GetProjectService {
  constructor(private readonly projects: ProjectRepository) {}

  async execute(ownerId: string, projectId: string): Promise<ProjectDto> {
    const project = await this.projects.findByIdForOwner(projectId, ownerId);

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    return toProjectDto(project, project.repository);
  }
}
