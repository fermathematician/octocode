import { AppError } from "../../../shared/appError.js";
import {
  branchNameFromTitle,
  uniqueBranchName,
} from "../../../shared/branch.js";
import { toStoryDto, type StoryDto } from "../../../shared/presenters.js";
import type { ProjectRepository } from "../../projects/repositories/ProjectRepository.js";
import type { SprintRepository } from "../../sprints/repositories/SprintRepository.js";
import type { StoryRepository } from "../repositories/StoryRepository.js";
import type { CreateStoryInput } from "../validation/story.schema.js";

export class CreateStoryService {
  constructor(
    private readonly stories: StoryRepository,
    private readonly sprints: SprintRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async execute(ownerId: string, input: CreateStoryInput): Promise<StoryDto> {
    const project = await this.projects.findByIdForOwner(
      input.projectId,
      ownerId,
    );

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const activeSprint = await this.sprints.findLatestByProject(input.projectId);
    const existingBranches =
      await this.stories.findBranchesByProject(input.projectId);

    const branch =
      input.branch ??
      uniqueBranchName(
        branchNameFromTitle(input.title),
        existingBranches,
      );

    const story = await this.stories.create({
      projectId: input.projectId,
      sprintId: activeSprint?.id ?? null,
      title: input.title,
      storyPoints: input.storyPoints,
      priority: input.priority,
      branch,
    });

    return toStoryDto(story);
  }
}
