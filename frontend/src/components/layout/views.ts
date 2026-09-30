export type GeneralViewId = "kanban" | "graph" | "calendar";

export interface GeneralViewDefinition {
  id: GeneralViewId;
  label: string;
}

export const GENERAL_VIEWS: GeneralViewDefinition[] = [
  { id: "kanban", label: "Kanban" },
  { id: "graph", label: "Graph" },
  { id: "calendar", label: "Calendar" },
];

export type ScreenId = GeneralViewId | "project";
