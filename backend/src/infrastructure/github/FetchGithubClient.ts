import { AppError } from "../../shared/appError.js";
import type {
  GithubClient,
  GithubCommitSummary,
  GithubRepositorySummary,
  GithubToken,
  GithubUser,
} from "./GithubClient.js";

interface FetchGithubClientOptions {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

interface GithubApiUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface GithubApiEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

interface GithubApiRepository {
  id: number;
  name: string;
  default_branch: string;
  private: boolean;
  owner: { login: string };
}

interface GithubApiCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string | null; date: string } | null;
  };
  author: { login: string } | null;
  html_url: string;
}

const API_BASE = "https://api.github.com";

export class FetchGithubClient implements GithubClient {
  constructor(private readonly options: FetchGithubClientOptions) {}

  private assertConfigured(): void {
    if (!this.options.clientId || !this.options.clientSecret) {
      throw new AppError("GitHub OAuth is not configured.", 503);
    }
  }

  getAuthorizeUrl(state: string): string {
    this.assertConfigured();

    const params = new URLSearchParams({
      client_id: this.options.clientId,
      redirect_uri: this.options.callbackUrl,
      scope: "read:user user:email repo",
      state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<GithubToken> {
    this.assertConfigured();

    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: this.options.clientId,
          client_secret: this.options.clientSecret,
          code,
          redirect_uri: this.options.callbackUrl,
        }),
      },
    );

    if (!response.ok) {
      throw new AppError("GitHub token exchange failed.", 502);
    }

    const data = (await response.json()) as {
      access_token?: string;
      token_type?: string;
      scope?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
    };

    if (!data.access_token) {
      throw new AppError("GitHub did not return an access token.", 401);
    }

    return {
      accessToken: data.access_token,
      scope: data.scope ?? "",
      tokenType: data.token_type ?? null,
      refreshToken: data.refresh_token ?? null,
      expiresAt:
        data.expires_in !== undefined
          ? new Date(Date.now() + data.expires_in * 1000)
          : null,
    };
  }

  private async request<T>(path: string, accessToken: string): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "octocode",
      },
    });

    if (!response.ok) {
      throw new AppError(
        `GitHub request failed with status ${response.status}.`,
        502,
      );
    }

    return (await response.json()) as T;
  }

  async getAuthenticatedUser(accessToken: string): Promise<GithubUser> {
    const user = await this.request<GithubApiUser>("/user", accessToken);

    let email = user.email;

    if (!email) {
      try {
        const emails = await this.request<GithubApiEmail[]>(
          "/user/emails",
          accessToken,
        );

        email =
          emails.find((entry) => entry.primary && entry.verified)?.email ??
          emails.find((entry) => entry.verified)?.email ??
          emails[0]?.email ??
          null;
      } catch {
        email = null;
      }
    }

    return {
      id: String(user.id),
      login: user.login,
      name: user.name,
      email,
      avatarUrl: user.avatar_url,
    };
  }

  async listRepositories(
    accessToken: string,
  ): Promise<GithubRepositorySummary[]> {
    const repositories = await this.request<GithubApiRepository[]>(
      "/user/repos?per_page=100&sort=updated",
      accessToken,
    );

    return repositories.map((repository) => ({
      repoId: String(repository.id),
      owner: repository.owner.login,
      name: repository.name,
      defaultBranch: repository.default_branch,
      isPrivate: repository.private,
    }));
  }

  async listCommits(
    accessToken: string,
    owner: string,
    repo: string,
    branch: string,
  ): Promise<GithubCommitSummary[]> {
    const commits = await this.request<GithubApiCommit[]>(
      `/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(branch)}&per_page=100`,
      accessToken,
    );

    return commits.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message.split("\n")[0] ?? "",
      authorLogin: commit.author?.login ?? null,
      authorName: commit.commit.author?.name ?? null,
      committedAt: new Date(commit.commit.author?.date ?? Date.now()),
      url: commit.html_url,
    }));
  }
}
