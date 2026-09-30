import { StoryStatus } from "../../../generated/prisma/client.js";
import { AppError } from "../../../shared/appError.js";
import { startOfToday } from "../../../shared/dates.js";
import { toStoryDto, type StoryDto } from "../../../shared/presenters.js";
import type { StoryRepository } from "../repositories/StoryRepository.js";

export class UpdateStoryStatusService {
  constructor(private readonly stories: StoryRepository) {}

  async execute(
    ownerId: string,
    storyId: string,
    status: StoryStatus,
  ): Promise<StoryDto> {
    const story = await this.stories.findByIdForOwner(storyId, ownerId);

    if (!story) {
      throw new AppError("Story not found", 404);
    }

    const completedAt =
      status === StoryStatus.REFACTOR ? startOfToday() : null;

    const updated = await this.stories.updateStatus(
      storyId,
      status,
      completedAt,
    );

    return toStoryDto(updated);
  }
}
