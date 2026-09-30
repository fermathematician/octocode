import { AppError } from "../../../shared/appError.js";
import { toProjectDto, type ProjectDto } from "../../../shared/presenters.js";
import type { ProjectRepository } from "../repositories/ProjectRepository.js";
import type { UpdateProjectInput } from "../validation/project.schema.js";

export class UpdateProjectService {
  constructor(private readonly projects: ProjectRepository) {}

  async execute(
    ownerId: string,
    projectId: string,
    input: UpdateProjectInput,
  ): Promise<ProjectDto> {
    const project = await this.projects.update(projectId, ownerId, input);

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    return toProjectDto(project, project.repository);
  }
}
