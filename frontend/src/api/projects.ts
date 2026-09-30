import type { Project } from "../domain/types";
import { apiFetch, type Paginated } from "./http";

export async function getProjects(): Promise<Project[]> {
  const page = await apiFetch<Paginated<Project>>("/projects");
  return page.items;
}
