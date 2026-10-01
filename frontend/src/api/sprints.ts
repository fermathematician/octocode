import type { Sprint } from "../domain/types";
import { apiFetch, type Paginated } from "./http";

export interface CreateSprintInput {
  projectId: string;
  name: string;
  startDate: string;
}

export async function getSprints(projectId?: string): Promise<Sprint[]> {
  const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
  const page = await apiFetch<Paginated<Sprint>>(`/sprints${query}`);
  return page.items;
}

export function createSprint(input: CreateSprintInput): Promise<Sprint> {
  return apiFetch<Sprint>("/sprints", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteSprint(sprintId: string): Promise<void> {
  return apiFetch<void>(`/sprints/${sprintId}`, { method: "DELETE" });
}
