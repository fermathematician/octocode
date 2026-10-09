import type { Sprint } from "../domain/types";
import { apiFetch, type Paginated } from "./http";

export interface CreateSprintInput {
  name: string;
  startDate: string;
  endDate: string;
}

export interface UpdateSprintInput {
  name?: string;
  startDate?: string;
  endDate?: string;
}

export async function getSprints(): Promise<Sprint[]> {
  const page = await apiFetch<Paginated<Sprint>>("/sprints");
  return page.items;
}

export function createSprint(input: CreateSprintInput): Promise<Sprint> {
  return apiFetch<Sprint>("/sprints", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateSprint(
  sprintId: string,
  input: UpdateSprintInput,
): Promise<Sprint> {
  return apiFetch<Sprint>(`/sprints/${sprintId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteSprint(sprintId: string): Promise<void> {
  return apiFetch<void>(`/sprints/${sprintId}`, { method: "DELETE" });
}
