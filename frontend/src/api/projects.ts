import type { Project } from "../domain/types";
import { apiFetch, type Paginated } from "./http";

export interface CreateProjectFromRepositoryInput {
  name: string;
  repoId: string;
  owner: string;
  repositoryName: string;
  defaultBranch: string;
  isPrivate: boolean;
}

export async function getProjects(): Promise<Project[]> {
  const page = await apiFetch<Paginated<Project>>("/projects");
  return page.items;
}

export function createProjectFromRepository(
  input: CreateProjectFromRepositoryInput,
): Promise<Project> {
  return apiFetch<Project>("/projects/from-repository", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface UpdateProjectInput {
  name?: string;
  color?: string;
}

export function updateProject(
  projectId: string,
  input: UpdateProjectInput,
): Promise<Project> {
  return apiFetch<Project>(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteProject(projectId: string): Promise<void> {
  return apiFetch<void>(`/projects/${projectId}`, { method: "DELETE" });
}
