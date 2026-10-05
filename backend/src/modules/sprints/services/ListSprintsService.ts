import {
  type Paginated,
  type Pagination,
} from "../../../shared/pagination.js";
import { toSprintDto, type SprintDto } from "../../../shared/presenters.js";
import type { SprintRepository } from "../repositories/SprintRepository.js";

export class ListSprintsService {
  constructor(private readonly sprints: SprintRepository) {}

  async execute(
    ownerId: string,
    pagination: Pagination,
  ): Promise<Paginated<SprintDto>> {
    const page = await this.sprints.findManyByOwner(ownerId, pagination);

    return {
      items: page.items.map(toSprintDto),
      nextCursor: page.nextCursor,
    };
  }
}
