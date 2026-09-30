import type {
  Story,
  StoryPoints,
  StoryPriority,
  StoryStatus,
} from "../domain/types";
import { branchNameFromTitle } from "../domain/story";
import { createId, db, delay } from "./db";

export interface CreateStoryInput {
  projectId: string;
  title: string;
  storyPoints: StoryPoints;
  priority: StoryPriority;
  branch?: string;
}

function buildUniqueBranchName(title: string): string {
  const base = branchNameFromTitle(title);

  let candidate = base;
  let counter = 2;

  while (db.stories.some((story) => story.branch === candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
}

export async function getStories(): Promise<Story[]> {
  await delay();
  return db.stories.map((story) => ({ ...story, commits: [...story.commits] }));
}

export async function createStory(input: CreateStoryInput): Promise<Story> {
  await delay();

  const projectSprints = db.sprints.filter(
    (sprint) => sprint.projectId === input.projectId,
  );
  const activeSprint =
    projectSprints
      .slice()
      .sort((first, second) =>
        second.startDate.localeCompare(first.startDate),
      )[0] ?? null;

  const story: Story = {
    id: createId("story"),
    projectId: input.projectId,
    sprintId: activeSprint ? activeSprint.id : null,
    title: input.title.trim(),
    storyPoints: input.storyPoints,
    priority: input.priority,
    status: "backlog",
    branch: input.branch?.trim()
      ? input.branch.trim()
      : buildUniqueBranchName(input.title),
    commits: [],
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  db.stories.push(story);

  return { ...story, commits: [...story.commits] };
}

export async function assignStoryBranch(
  storyId: string,
  branch: string,
): Promise<Story> {
  await delay();

  const story = db.stories.find((candidate) => candidate.id === storyId);

  if (!story) {
    throw new Error("Story not found.");
  }

  story.branch = branch.trim();

  return { ...story, commits: [...story.commits] };
}

export async function updateStoryStatus(
  storyId: string,
  status: StoryStatus,
): Promise<Story> {
  await delay();

  const story = db.stories.find((candidate) => candidate.id === storyId);

  if (!story) {
    throw new Error("Story not found.");
  }

  story.status = status;
  story.completedAt =
    status === "refactor" ? new Date().toISOString().slice(0, 10) : null;

  return { ...story, commits: [...story.commits] };
}
