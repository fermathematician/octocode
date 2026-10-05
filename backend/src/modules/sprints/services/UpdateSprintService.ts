import { AppError } from "../../../shared/appError.js";
import { fromIsoDate } from "../../../shared/dates.js";
import { toSprintDto, type SprintDto } from "../../../shared/presenters.js";
import type {
  SprintRepository,
  UpdateSprintData,
} from "../repositories/SprintRepository.js";
import type { UpdateSprintInput } from "../validation/sprint.schema.js";

export class UpdateSprintService {
  constructor(private readonly sprints: SprintRepository) {}

  async execute(
    ownerId: string,
    sprintId: string,
    input: UpdateSprintInput,
  ): Promise<SprintDto> {
    const existing = await this.sprints.findByIdForOwner(sprintId, ownerId);

    if (!existing) {
      throw new AppError("Sprint not found", 404);
    }

    const startDate =
      input.startDate !== undefined
        ? fromIsoDate(input.startDate)
        : existing.startDate;
    const endDate =
      input.endDate !== undefined ? fromIsoDate(input.endDate) : existing.endDate;

    if (endDate < startDate) {
      throw new AppError("The end date cannot be before the start date.", 400);
    }

    const data: UpdateSprintData = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }

    if (input.startDate !== undefined) {
      data.startDate = startDate;
    }

    if (input.endDate !== undefined) {
      data.endDate = endDate;
    }

    const sprint = await this.sprints.update(sprintId, ownerId, data);

    if (!sprint) {
      throw new AppError("Sprint not found", 404);
    }

    return toSprintDto(sprint);
  }
}
