import { OAuthProvider } from "../../../generated/prisma/client.js";
import type { TokenCipher } from "../../../infrastructure/auth/TokenCipher.js";
import type { GithubClient } from "../../../infrastructure/github/GithubClient.js";
import { AppError } from "../../../shared/appError.js";
import type { OAuthAccountRepository } from "../../auth/repositories/OAuthAccountRepository.js";
import type { ProjectRepository } from "../../projects/repositories/ProjectRepository.js";
import type { GithubRepositoryRepository } from "../repositories/GithubRepositoryRepository.js";
import type { LocalBranchRepository } from "../repositories/LocalBranchRepository.js";

export interface ProjectBranch {
  name: string;
  /** `local` means the branch exists only in the developer's clone. */
  source: "github" | "local";
}

export class ListProjectBranchesService {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly githubRepositories: GithubRepositoryRepository,
    private readonly localBranches: LocalBranchRepository,
    private readonly oauthAccounts: OAuthAccountRepository,
    private readonly tokenCipher: TokenCipher,
    private readonly githubClient: GithubClient,
  ) {}

  async execute(ownerId: string, projectId: string): Promise<ProjectBranch[]> {
    const project = await this.projects.findByIdForOwner(projectId, ownerId);

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const repository = await this.githubRepositories.findByProject(projectId);

    if (!repository) {
      throw new AppError("Project has no linked GitHub repository.", 400);
    }

    const account = await this.oauthAccounts.findByUser(
      ownerId,
      OAuthProvider.GITHUB,
    );

    if (!account) {
      throw new AppError("GitHub account is not connected.", 400);
    }

    const accessToken = this.tokenCipher.decrypt(account.accessToken);
    const [githubBranches, localBranches] = await Promise.all([
      this.githubClient.listBranches(
        accessToken,
        repository.owner,
        repository.name,
      ),
      this.localBranches.listByProject(projectId),
    ]);

    const known = new Set(githubBranches.map((branch) => branch.name));

    return [
      ...githubBranches.map(
        (branch): ProjectBranch => ({ name: branch.name, source: "github" }),
      ),
      ...localBranches
        .filter((branch) => !known.has(branch.name))
        .map((branch): ProjectBranch => ({ name: branch.name, source: "local" })),
    ];
  }
}
