import { addDays, daysBetween, parseIsoDate, toIsoDate } from "../shared/date";
import type { Sprint, Story } from "./types";

export interface BurndownPoint {
  day: number;
  ideal: number;
  remaining: number;
}

/// The active sprint is the latest one the user created, regardless of project:
/// a sprint spans every project.
export function selectActiveSprint(sprints: Sprint[]): Sprint | null {
  if (sprints.length === 0) {
    return null;
  }

  return sprints.reduce((latest, sprint) =>
    sprint.startDate > latest.startDate ? sprint : latest,
  );
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
  const totalDays = Math.max(1, daysBetween(start, end));
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
