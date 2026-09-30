export type ViewId = "backlog" | "sprint" | "calendar" | "progress";

export interface ViewDefinition {
  id: ViewId;
  label: string;
}

export const VIEWS: ViewDefinition[] = [
  { id: "backlog", label: "Backlog" },
  { id: "sprint", label: "Sprint" },
  { id: "calendar", label: "Calendar" },
  { id: "progress", label: "Progress" },
];
