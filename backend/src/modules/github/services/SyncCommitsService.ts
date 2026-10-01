import type { GithubRepository } from "../../../generated/prisma/client.js";
import type { StoryRepository } from "../../stories/repositories/StoryRepository.js";
import type { GithubRepositoryRepository } from "../repositories/GithubRepositoryRepository.js";
import type { SyncStoryCommitsService } from "./SyncStoryCommitsService.js";

export interface SyncCommitsResult {
  stories: number;
  commits: number;
}

/**
 * Syncs commits for one or many repositories by delegating each story to
 * `SyncStoryCommitsService`. Used by the background interval, the webhook
 * handler and the "sync on open" endpoint.
 */
export class SyncCommitsService {
  constructor(
    private readonly repositories: GithubRepositoryRepository,
    private readonly stories: StoryRepository,
    private readonly syncStoryCommits: SyncStoryCommitsService,
  ) {}

  executeForUser(ownerId: string): Promise<SyncCommitsResult> {
    return this.repositories
      .findAllByUser(ownerId)
      .then((repositories) => this.executeForRepositories(repositories));
  }

  executeAll(): Promise<SyncCommitsResult> {
    return this.repositories
      .findAll()
      .then((repositories) => this.executeForRepositories(repositories));
  }

  executeForRepository(
    repository: GithubRepository,
  ): Promise<SyncCommitsResult> {
    return this.executeForRepositories([repository]);
  }

  private async executeForRepositories(
    repositories: GithubRepository[],
  ): Promise<SyncCommitsResult> {
    let stories = 0;
    let commits = 0;

    for (const repository of repositories) {
      const storyIds = await this.stories.findIdsByProject(repository.projectId);

      for (const storyId of storyIds) {
        try {
          const result = await this.syncStoryCommits.execute(
            repository.userId,
            storyId,
          );
          stories += 1;
          commits += result.commitCount;
        } catch (error) {
          // One story's failure must not stop the rest.
          console.error("Commit sync failed.", { storyId, error });
        }
      }
    }

    return { stories, commits };
  }
}
