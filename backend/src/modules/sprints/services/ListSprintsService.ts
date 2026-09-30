import { toSprintDto, type SprintDto } from "../../../shared/presenters.js";
import type { SprintRepository } from "../repositories/SprintRepository.js";

export class ListSprintsService {
  constructor(private readonly sprints: SprintRepository) {}

  async execute(ownerId: string, projectId?: string): Promise<SprintDto[]> {
    const sprints = await this.sprints.findManyByOwner(ownerId, projectId);

    return sprints.map(toSprintDto);
  }
}
