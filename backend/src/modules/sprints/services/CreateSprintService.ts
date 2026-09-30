import { AppError } from "../../../shared/appError.js";
import { addDays, fromIsoDate } from "../../../shared/dates.js";
import { toSprintDto, type SprintDto } from "../../../shared/presenters.js";
import type { ProjectRepository } from "../../projects/repositories/ProjectRepository.js";
import type { SprintRepository } from "../repositories/SprintRepository.js";
import type { CreateSprintInput } from "../validation/sprint.schema.js";

/// All sprints are one week long (see README R10).
const SPRINT_LENGTH_DAYS = 6;

export class CreateSprintService {
  constructor(
    private readonly sprints: SprintRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async execute(ownerId: string, input: CreateSprintInput): Promise<SprintDto> {
    const project = await this.projects.findByIdForOwner(
      input.projectId,
      ownerId,
    );

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const startDate = fromIsoDate(input.startDate);
    const sprint = await this.sprints.create({
      projectId: input.projectId,
      name: input.name,
      startDate,
      endDate: addDays(startDate, SPRINT_LENGTH_DAYS),
    });

    return toSprintDto(sprint);
  }
}
