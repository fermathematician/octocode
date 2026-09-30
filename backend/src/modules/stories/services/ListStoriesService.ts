import { toStoryDto, type StoryDto } from "../../../shared/presenters.js";
import type {
  StoryFilters,
  StoryRepository,
} from "../repositories/StoryRepository.js";

export class ListStoriesService {
  constructor(private readonly stories: StoryRepository) {}

  async execute(ownerId: string, filters: StoryFilters): Promise<StoryDto[]> {
    const stories = await this.stories.findManyByOwner(ownerId, filters);

    return stories.map(toStoryDto);
  }
}
