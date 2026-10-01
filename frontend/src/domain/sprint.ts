import { addDays, daysBetween, parseIsoDate, toIsoDate } from "../shared/date";
import type { Sprint, Story } from "./types";

/// A sprint is one week; the burndown never spans more than 7 days, even when the
/// graph combines active sprints from several projects.
const SPRINT_DURATION_DAYS = 7;

export interface BurndownPoint {
  day: number;
  ideal: number;
  remaining: number;
}

export function latestSprintPerProject(sprints: Sprint[]): Sprint[] {
  const latest = new Map<string, Sprint>();

  for (const sprint of sprints) {
    const current = latest.get(sprint.projectId);

    if (!current || sprint.startDate > current.startDate) {
      latest.set(sprint.projectId, sprint);
    }
  }

  return [...latest.values()];
}

export function selectActiveSprints(
  sprints: Sprint[],
  projectId: string | null,
): Sprint[] {
  if (sprints.length === 0) {
    return [];
  }

  if (projectId === null) {
    return latestSprintPerProject(sprints);
  }

  const projectSprints = sprints.filter(
    (sprint) => sprint.projectId === projectId,
  );

  if (projectSprints.length === 0) {
    return [];
  }

  return [
    projectSprints
      .slice()
      .sort((first, second) => second.startDate.localeCompare(first.startDate))[0],
  ];
}

export function buildBurndown(
  sprints: Sprint[],
  stories: Story[],
): BurndownPoint[] {
  if (sprints.length === 0) {
    return [];
  }

  const start = sprints.reduce(
    (earliest, sprint) =>
      sprint.startDate < earliest ? sprint.startDate : earliest,
    sprints[0].startDate,
  );
  const end = sprints.reduce(
    (latest, sprint) => (sprint.endDate > latest ? sprint.endDate : latest),
    sprints[0].endDate,
  );
  const totalDays = Math.min(
    SPRINT_DURATION_DAYS - 1,
    Math.max(1, daysBetween(start, end)),
  );
  const totalPoints = stories.reduce(
    (sum, story) => sum + story.storyPoints,
    0,
  );

  const startDate = parseIsoDate(start);
  const points: BurndownPoint[] = [];

  for (let day = 0; day <= totalDays; day += 1) {
    const currentDate = toIsoDate(addDays(startDate, day));
    const completed = stories
      .filter(
        (story) =>
          story.status === "refactor" &&
          story.completedAt !== null &&
          story.completedAt <= currentDate,
      )
      .reduce((sum, story) => sum + story.storyPoints, 0);

    points.push({
      day,
      ideal: Math.max(0, totalPoints - (totalPoints / totalDays) * day),
      remaining: Math.max(0, totalPoints - completed),
    });
  }

  return points;
}
