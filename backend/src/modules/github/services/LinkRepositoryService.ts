import { AppError } from "../../../shared/appError.js";
import {
  toGithubRepositoryDto,
  type GithubRepositoryDto,
} from "../../../shared/presenters.js";
import type { ProjectRepository } from "../../projects/repositories/ProjectRepository.js";
import type { GithubRepositoryRepository } from "../repositories/GithubRepositoryRepository.js";
import type { LinkRepositoryInput } from "../validation/github.schema.js";

export class LinkRepositoryService {
  constructor(
    private readonly repositories: GithubRepositoryRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async execute(
    ownerId: string,
    input: LinkRepositoryInput,
  ): Promise<GithubRepositoryDto> {
    const project = await this.projects.findByIdForOwner(
      input.projectId,
      ownerId,
    );

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const repository = await this.repositories.save({
      projectId: input.projectId,
      userId: ownerId,
      repoId: input.repoId,
      owner: input.owner,
      name: input.name,
      defaultBranch: input.defaultBranch,
      isPrivate: input.isPrivate,
      installationId: null,
    });

    return toGithubRepositoryDto(repository);
  }
}
