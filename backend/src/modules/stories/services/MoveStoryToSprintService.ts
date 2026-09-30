import { AppError } from "../../../shared/appError.js";
import { toStoryDto, type StoryDto } from "../../../shared/presenters.js";
import type { SprintRepository } from "../../sprints/repositories/SprintRepository.js";
import type { StoryRepository } from "../repositories/StoryRepository.js";

export class MoveStoryToSprintService {
  constructor(
    private readonly stories: StoryRepository,
    private readonly sprints: SprintRepository,
  ) {}

  async execute(
    ownerId: string,
    storyId: string,
    sprintId: string | null,
  ): Promise<StoryDto> {
    const story = await this.stories.findByIdForOwner(storyId, ownerId);

    if (!story) {
      throw new AppError("Story not found", 404);
    }

    if (sprintId !== null) {
      const sprint = await this.sprints.findByIdForOwner(sprintId, ownerId);

      if (!sprint) {
        throw new AppError("Sprint not found", 404);
      }

      if (sprint.projectId !== story.projectId) {
        throw new AppError(
          "The sprint belongs to a different project.",
          400,
        );
      }
    }

    const updated = await this.stories.moveToSprint(storyId, sprintId);

    return toStoryDto(updated);
  }
}
