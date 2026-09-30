import type { Project } from "../domain/types";
import { apiFetch } from "./http";

export function getProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/projects");
}
