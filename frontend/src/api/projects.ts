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
