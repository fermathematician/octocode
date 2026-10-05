import { AppError } from "../../../shared/appError.js";
import { fromIsoDate } from "../../../shared/dates.js";
import { toSprintDto, type SprintDto } from "../../../shared/presenters.js";
import type { SprintRepository } from "../repositories/SprintRepository.js";
import type { CreateSprintInput } from "../validation/sprint.schema.js";

export class CreateSprintService {
  constructor(private readonly sprints: SprintRepository) {}

  async execute(ownerId: string, input: CreateSprintInput): Promise<SprintDto> {
    const startDate = fromIsoDate(input.startDate);
    const endDate = fromIsoDate(input.endDate);

    if (endDate < startDate) {
      throw new AppError("The end date cannot be before the start date.", 400);
    }

    const sprint = await this.sprints.create({
      ownerId,
      name: input.name,
      startDate,
      endDate,
    });

    return toSprintDto(sprint);
  }
}
