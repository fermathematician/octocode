import type {
  CalendarEvent as CalendarEventModel,
  Commit as CommitModel,
  GithubRepository as GithubRepositoryModel,
  Project as ProjectModel,
  Sprint as SprintModel,
  Story as StoryModel,
  User as UserModel,
} from "../generated/prisma/client.js";
import { toIsoDate } from "./dates.js";

export interface ProjectDto {
  id: string;
  name: string;
  githubAccount: string;
  repository: string;
  color: string;
}

export interface SprintDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface CommitDto {
  id: string;
  sha: string;
  message: string;
  author: string;
  committedAt: string;
}

export interface StoryDto {
  id: string;
  projectId: string;
  sprintId: string | null;
  title: string;
  storyPoints: number;
  priority: string;
  status: string;
  branch: string;
  imported: boolean;
  commits: CommitDto[];
  createdAt: string;
  completedAt: string | null;
}

export interface CalendarEventDto {
  id: string;
  type: string;
  title: string;
  date: string;
  startTime: string;
  notes: string;
  completed: boolean;
  source: string;
}

export interface UserDto {
  id: string;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export interface GithubRepositoryDto {
  repoId: string;
  owner: string;
  name: string;
  defaultBranch: string;
  isPrivate: boolean;
}

export function toUserDto(user: UserModel): UserDto {
  return {
    id: user.id,
    login: user.login,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}

export function toProjectDto(
  project: ProjectModel,
  repository: Pick<GithubRepositoryModel, "owner" | "name"> | null,
): ProjectDto {
  return {
    id: project.id,
    name: project.name,
    githubAccount: repository?.owner ?? "",
    repository: repository?.name ?? "",
    color: project.color,
  };
}

export function toSprintDto(sprint: SprintModel): SprintDto {
  return {
    id: sprint.id,
    name: sprint.name,
    startDate: toIsoDate(sprint.startDate),
    endDate: toIsoDate(sprint.endDate),
  };
}

export function toCommitDto(commit: CommitModel): CommitDto {
  return {
    id: commit.id,
    sha: commit.sha,
    message: commit.message,
    author: commit.authorLogin ?? commit.authorName ?? "unknown",
    committedAt: commit.committedAt.toISOString(),
  };
}

export function toStoryDto(
  story: StoryModel & { commits: CommitModel[] },
): StoryDto {
  return {
    id: story.id,
    projectId: story.projectId,
    sprintId: story.sprintId,
    title: story.title,
    storyPoints: story.storyPoints,
    priority: story.priority.toLowerCase(),
    status: story.status.toLowerCase(),
    branch: story.branch,
    imported: story.imported,
    commits: story.commits.map(toCommitDto),
    createdAt: story.createdAt.toISOString(),
    completedAt: story.completedAt ? toIsoDate(story.completedAt) : null,
  };
}

export function toCalendarEventDto(event: CalendarEventModel): CalendarEventDto {
  return {
    id: event.id,
    type: event.type.toLowerCase(),
    title: event.title,
    date: toIsoDate(event.date),
    startTime: event.startTime,
    notes: event.notes,
    completed: event.completed,
    source: event.source.toLowerCase(),
  };
}

export function toGithubRepositoryDto(
  repository: GithubRepositoryModel,
): GithubRepositoryDto {
  return {
    repoId: repository.repoId,
    owner: repository.owner,
    name: repository.name,
    defaultBranch: repository.defaultBranch,
    isPrivate: repository.isPrivate,
  };
}
