export const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21] as const;

export type StoryPoints = (typeof STORY_POINTS)[number];

export const STORY_PRIORITIES = ["critical", "high", "medium", "low"] as const;

export type StoryPriority = (typeof STORY_PRIORITIES)[number];

export const STORY_STATUSES = [
  "backlog",
  "design",
  "code",
  "test",
  "refactor",
] as const;

export type StoryStatus = (typeof STORY_STATUSES)[number];

export const CALENDAR_EVENT_TYPES = ["reminder", "task", "meeting"] as const;

export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number];

export interface Commit {
  id: string;
  sha: string;
  message: string;
  author: string;
  committedAt: string;
}

export interface Story {
  id: string;
  projectId: string;
  sprintId: string | null;
  title: string;
  storyPoints: StoryPoints;
  priority: StoryPriority;
  status: StoryStatus;
  branch: string;
  commits: Commit[];
  createdAt: string;
  completedAt: string | null;
}

export interface Project {
  id: string;
  name: string;
  githubAccount: string;
  repository: string;
  color: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string;
  startTime: string;
  notes: string;
}

export interface CurrentUser {
  id: string;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}
