import { toProjectDto, type ProjectDto } from "../../../shared/presenters.js";
import type { ProjectRepository } from "../repositories/ProjectRepository.js";
import type { CreateProjectInput } from "../validation/project.schema.js";

export class CreateProjectService {
  constructor(private readonly projects: ProjectRepository) {}

  async execute(
    ownerId: string,
    input: CreateProjectInput,
  ): Promise<ProjectDto> {
    const project = await this.projects.create({
      ownerId,
      name: input.name,
      color: input.color,
    });

    return toProjectDto(project, project.repository);
  }
}
