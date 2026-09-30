import {
  seedCalendarEvents,
  seedProjects,
  seedSprints,
  seedStories,
} from "../data/seed";
import type { CalendarEvent, Project, Sprint, Story } from "../domain/types";

export interface LocalDatabase {
  projects: Project[];
  stories: Story[];
  sprints: Sprint[];
  calendarEvents: CalendarEvent[];
}

export const db: LocalDatabase = {
  projects: seedProjects.map((project) => ({ ...project })),
  stories: seedStories.map((story) => ({ ...story, commits: [...story.commits] })),
  sprints: seedSprints.map((sprint) => ({ ...sprint })),
  calendarEvents: seedCalendarEvents.map((event) => ({ ...event })),
};

export function delay(milliseconds = 120): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
