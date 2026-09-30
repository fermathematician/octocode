import type { Sprint } from "../domain/types";
import { db, delay } from "./db";

export async function getSprints(): Promise<Sprint[]> {
  await delay();
  return db.sprints.map((sprint) => ({ ...sprint }));
}
