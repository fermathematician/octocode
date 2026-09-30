import type { CurrentUser } from "../domain/types";
import { apiFetch } from "./http";

export function signInWithGithubToken(token: string): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/auth/dev-token", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}
