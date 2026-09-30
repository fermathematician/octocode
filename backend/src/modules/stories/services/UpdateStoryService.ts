import { AppError } from "../../../shared/appError.js";
import { toStoryDto, type StoryDto } from "../../../shared/presenters.js";
import type { StoryRepository } from "../repositories/StoryRepository.js";
import type { UpdateStoryInput } from "../validation/story.schema.js";

export class UpdateStoryService {
  constructor(private readonly stories: StoryRepository) {}

  async execute(
    ownerId: string,
    storyId: string,
    input: UpdateStoryInput,
  ): Promise<StoryDto> {
    const story = await this.stories.findByIdForOwner(storyId, ownerId);

    if (!story) {
      throw new AppError("Story not found", 404);
    }

    const updated = await this.stories.update(storyId, input);

    return toStoryDto(updated);
  }
}
