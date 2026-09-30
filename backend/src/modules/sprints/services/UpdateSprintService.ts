import { AppError } from "../../../shared/appError.js";
import { addDays, fromIsoDate } from "../../../shared/dates.js";
import { toSprintDto, type SprintDto } from "../../../shared/presenters.js";
import { SPRINT_LENGTH_DAYS } from "../constants.js";
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

    const data: UpdateSprintData = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }

    if (input.startDate !== undefined) {
      const startDate = fromIsoDate(input.startDate);
      data.startDate = startDate;
      data.endDate = addDays(startDate, SPRINT_LENGTH_DAYS);
    }

    const sprint = await this.sprints.update(sprintId, ownerId, data);

    if (!sprint) {
      throw new AppError("Sprint not found", 404);
    }

    return toSprintDto(sprint);
  }
}
