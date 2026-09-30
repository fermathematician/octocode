import type { Sprint } from "../domain/types";
import { apiFetch, type Paginated } from "./http";

export async function getSprints(projectId?: string): Promise<Sprint[]> {
  const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
  const page = await apiFetch<Paginated<Sprint>>(`/sprints${query}`);
  return page.items;
}
