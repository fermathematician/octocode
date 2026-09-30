import { toProjectDto, type ProjectDto } from "../../../shared/presenters.js";
import type { GithubRepositoryRepository } from "../../github/repositories/GithubRepositoryRepository.js";
import type { ProjectRepository } from "../repositories/ProjectRepository.js";
import type { CreateProjectFromRepositoryInput } from "../validation/project.schema.js";

export class CreateProjectFromRepositoryService {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly githubRepositories: GithubRepositoryRepository,
  ) {}

  async execute(
    ownerId: string,
    input: CreateProjectFromRepositoryInput,
  ): Promise<ProjectDto> {
    const project = await this.projects.create({
      ownerId,
      name: input.name,
      color: input.color,
    });

    try {
      const repository = await this.githubRepositories.save({
        projectId: project.id,
        userId: ownerId,
        repoId: input.repoId,
        owner: input.owner,
        name: input.repositoryName,
        defaultBranch: input.defaultBranch,
        isPrivate: input.isPrivate,
        installationId: null,
      });

      return toProjectDto(project, repository);
    } catch (error) {
      // Compensate: do not leave a project without its linked repository.
      await this.projects.delete(project.id, ownerId);
      throw error;
    }
  }
}
