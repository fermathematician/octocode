import { AppError } from "../../../shared/appError.js";
import { toStoryDto, type StoryDto } from "../../../shared/presenters.js";
import type { StoryRepository } from "../repositories/StoryRepository.js";

export class AssignStoryBranchService {
  constructor(private readonly stories: StoryRepository) {}

  async execute(
    ownerId: string,
    storyId: string,
    branch: string,
  ): Promise<StoryDto> {
    const story = await this.stories.findByIdForOwner(storyId, ownerId);

    if (!story) {
      throw new AppError("Story not found", 404);
    }

    const updated = await this.stories.updateBranch(storyId, branch);

    return toStoryDto(updated);
  }
}
