export type GeneralViewId =
  | "today"
  | "sprints"
  | "kanban"
  | "graph"
  | "calendar"
  | "debug";

export interface GeneralViewDefinition {
  id: GeneralViewId;
  label: string;
}

export interface GeneralViewGroup {
  label: string;
  views: GeneralViewDefinition[];
}

export const GENERAL_VIEW_GROUPS: GeneralViewGroup[] = [
  {
    label: "Plan",
    views: [
      { id: "today", label: "Today" },
      { id: "calendar", label: "Calendar" },
    ],
  },
  {
    label: "Sprint",
    views: [
      { id: "sprints", label: "Sprints" },
      { id: "kanban", label: "Kanban" },
      { id: "graph", label: "Graph" },
    ],
  },
  {
    label: "System",
    views: [{ id: "debug", label: "Debug" }],
  },
];

export type ScreenId = GeneralViewId | "project";
