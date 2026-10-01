import { AppError } from "../../../shared/appError.js";
import type { GithubRepositoryRepository } from "../repositories/GithubRepositoryRepository.js";
import type { LocalBranchRepository } from "../repositories/LocalBranchRepository.js";
import type { RecordLocalBranchesInput } from "../validation/github.schema.js";

export interface RecordLocalBranchesResult {
  projectId: string;
  recorded: number;
}

/**
 * Stores the branch list reported by the local git hook. The repository is
 * identified by `owner`/`name` (parsed from the git remote) and scoped to the
 * caller, so the hook never needs to know the project id.
 */
export class RecordLocalBranchesService {
  constructor(
    private readonly githubRepositories: GithubRepositoryRepository,
    private readonly localBranches: LocalBranchRepository,
  ) {}

  async execute(
    ownerId: string,
    input: RecordLocalBranchesInput,
  ): Promise<RecordLocalBranchesResult> {
    const repository =
      await this.githubRepositories.findByUserAndOwnerAndName(
        ownerId,
        input.owner,
        input.name,
      );

    if (!repository) {
      throw new AppError(
        "Repository is not linked to one of your projects.",
        404,
      );
    }

    const recorded = await this.localBranches.replaceAll(
      repository.projectId,
      input.names,
    );

    return { projectId: repository.projectId, recorded: recorded.length };
  }
}
