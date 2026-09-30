import { randomBytes } from "node:crypto";
import type { GithubClient } from "../../../infrastructure/github/GithubClient.js";

export interface StartGithubLoginResult {
  state: string;
  authorizeUrl: string;
}

export class StartGithubLoginService {
  constructor(private readonly githubClient: GithubClient) {}

  execute(): StartGithubLoginResult {
    const state = randomBytes(16).toString("base64url");

    return {
      state,
      authorizeUrl: this.githubClient.getAuthorizeUrl(state),
    };
  }
}
