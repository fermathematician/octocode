import { AppError } from "../../../shared/appError.js";
import type { StoryRepository } from "../repositories/StoryRepository.js";

export class DeleteStoryService {
  constructor(private readonly stories: StoryRepository) {}

  async execute(ownerId: string, storyId: string): Promise<void> {
    const deleted = await this.stories.delete(storyId, ownerId);

    if (!deleted) {
      throw new AppError("Story not found", 404);
    }
  }
}
