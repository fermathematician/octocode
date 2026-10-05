import type { GithubRepository } from "../../../generated/prisma/client.js";
import type { SyncBranchStoriesService } from "./SyncBranchStoriesService.js";
import type { SyncCommitsService } from "./SyncCommitsService.js";

export interface SyncRepositoriesResult {
  branchesCreated: number;
  stories: number;
  commits: number;
}

/**
 * Orchestrates the two repository concerns for one sync call: create cards for
 * new pushed branches, then refresh every story's commits. Each underlying
 * service stays single-purpose.
 */
export class SyncRepositoriesService {
  constructor(
    private readonly branchStories: SyncBranchStoriesService,
    private readonly commits: SyncCommitsService,
  ) {}

  async executeForUser(ownerId: string): Promise<SyncRepositoriesResult> {
    const branches = await this.branchStories.executeForUser(ownerId);
    const commitResult = await this.commits.executeForUser(ownerId);

    return {
      branchesCreated: branches.created,
      stories: commitResult.stories,
      commits: commitResult.commits,
    };
  }

  async executeForRepository(
    repository: GithubRepository,
  ): Promise<SyncRepositoriesResult> {
    const branches = await this.branchStories.executeForRepository(repository);
    const commitResult = await this.commits.executeForRepository(repository);

    return {
      branchesCreated: branches.created,
      stories: commitResult.stories,
      commits: commitResult.commits,
    };
  }

  async executeAll(): Promise<SyncRepositoriesResult> {
    const branches = await this.branchStories.executeAll();
    const commitResult = await this.commits.executeAll();

    return {
      branchesCreated: branches.created,
      stories: commitResult.stories,
      commits: commitResult.commits,
    };
  }
}
