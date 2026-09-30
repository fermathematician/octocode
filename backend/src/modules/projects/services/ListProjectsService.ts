import {
  type Paginated,
  type Pagination,
} from "../../../shared/pagination.js";
import { toProjectDto, type ProjectDto } from "../../../shared/presenters.js";
import type { ProjectRepository } from "../repositories/ProjectRepository.js";

export class ListProjectsService {
  constructor(private readonly projects: ProjectRepository) {}

  async execute(
    ownerId: string,
    pagination: Pagination,
  ): Promise<Paginated<ProjectDto>> {
    const page = await this.projects.findManyByOwner(ownerId, pagination);

    return {
      items: page.items.map((project) =>
        toProjectDto(project, project.repository),
      ),
      nextCursor: page.nextCursor,
    };
  }
}
