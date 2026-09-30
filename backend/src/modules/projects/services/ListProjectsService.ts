import { toProjectDto, type ProjectDto } from "../../../shared/presenters.js";
import type { ProjectRepository } from "../repositories/ProjectRepository.js";

export class ListProjectsService {
  constructor(private readonly projects: ProjectRepository) {}

  async execute(ownerId: string): Promise<ProjectDto[]> {
    const projects = await this.projects.findManyByOwner(ownerId);

    return projects.map((project) => toProjectDto(project, project.repository));
  }
}
