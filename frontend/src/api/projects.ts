import type { Project } from "../domain/types";
import { db, delay } from "./db";

export async function getProjects(): Promise<Project[]> {
  await delay();
  return db.projects.map((project) => ({ ...project }));
}
