export type GeneralViewId = "today" | "kanban" | "graph" | "calendar";

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
      { id: "kanban", label: "Kanban" },
      { id: "graph", label: "Graph" },
    ],
  },
];

export type ScreenId = GeneralViewId | "project";
