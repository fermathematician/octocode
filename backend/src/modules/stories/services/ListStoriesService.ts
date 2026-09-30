import {
  type Paginated,
  type Pagination,
} from "../../../shared/pagination.js";
import { toStoryDto, type StoryDto } from "../../../shared/presenters.js";
import type {
  StoryFilters,
  StoryRepository,
} from "../repositories/StoryRepository.js";

export class ListStoriesService {
  constructor(private readonly stories: StoryRepository) {}

  async execute(
    ownerId: string,
    filters: StoryFilters,
    pagination: Pagination,
  ): Promise<Paginated<StoryDto>> {
    const page = await this.stories.findManyByOwner(
      ownerId,
      filters,
      pagination,
    );

    return {
      items: page.items.map(toStoryDto),
      nextCursor: page.nextCursor,
    };
  }
}
