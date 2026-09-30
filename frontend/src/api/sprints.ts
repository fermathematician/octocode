import type { Sprint } from "../domain/types";
import { apiFetch } from "./http";

export function getSprints(projectId?: string): Promise<Sprint[]> {
  const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
  return apiFetch<Sprint[]>(`/sprints${query}`);
}
