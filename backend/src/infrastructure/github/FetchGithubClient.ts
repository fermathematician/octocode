import { AppError } from "../../shared/appError.js";
import type {
  GithubBranchComparison,
  GithubBranchSummary,
  GithubClient,
  GithubCommitSummary,
  GithubOrganizationSummary,
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

interface GithubApiOrganization {
  login: string;
}

function toRepositorySummary(
  repository: GithubApiRepository,
): GithubRepositorySummary {
  return {
    repoId: String(repository.id),
    owner: repository.owner.login,
    name: repository.name,
    defaultBranch: repository.default_branch,
    isPrivate: repository.private,
  };
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

interface GithubApiBranch {
  name: string;
}

interface GithubApiComparison {
  status: string;
  ahead_by?: number;
  behind_by?: number;
  commits?: GithubApiCommit[];
}

const API_BASE = "https://api.github.com";

type AuthScheme = "Bearer" | "token";

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
      scope: "read:user user:email read:org repo",
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

  private send(
    path: string,
    accessToken: string,
    scheme: AuthScheme,
  ): Promise<Response> {
    return fetch(`${API_BASE}${path}`, {
      headers: {
        Authorization: `${scheme} ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "octocode",
      },
    });
  }

  /**
   * GitHub accepts `Bearer` for OAuth/app tokens but classic personal access
   * tokens (`ghp_…`) have historically required the `token` scheme. Try `Bearer`
   * first and fall back to `token` on a 401 so both token types work.
   */
  private async request<T>(path: string, accessToken: string): Promise<T> {
    const bearerResponse = await this.send(path, accessToken, "Bearer");

    if (bearerResponse.status === 401) {
      const tokenResponse = await this.send(path, accessToken, "token");
      return this.parse<T>(tokenResponse);
    }

    return this.parse<T>(bearerResponse);
  }

  private async parse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const sso = response.headers.get("x-github-sso");

      if (sso) {
        const url = /url=([^;]+)/.exec(sso)?.[1]?.trim();
        throw new AppError(
          url
            ? `GitHub requires SAML SSO authorization for this organization. Authorize the token here: ${url}`
            : "GitHub requires SAML SSO authorization for this organization. Authorize the app's token for the organization on GitHub.",
          403,
        );
      }

      if (response.status === 401) {
        throw new AppError(
          "GitHub rejected the access token. Check that it is valid and not expired (classic tokens need the `repo` and `read:user` scopes).",
          401,
        );
      }

      if (response.status === 403) {
        throw new AppError(
          "GitHub denied access. Your token may lack the required permissions — classic PAT: `repo`; fine-grained PAT: Contents (read) + Metadata (read).",
          403,
        );
      }

      if (response.status === 404) {
        throw new AppError(
          "GitHub returned 404: the repository was not found or your token cannot access it.",
          404,
        );
      }

      if (response.status === 409) {
        throw new AppError(
          "GitHub says this repository has no branches yet (it may be empty).",
          409,
        );
      }

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

  async listOrganizations(
    accessToken: string,
  ): Promise<GithubOrganizationSummary[]> {
    const organizations: GithubOrganizationSummary[] = [];
    const perPage = 100;
    const maxPages = 10;

    for (let page = 1; page <= maxPages; page += 1) {
      const pageOrganizations = await this.request<GithubApiOrganization[]>(
        `/user/orgs?per_page=${perPage}&page=${page}`,
        accessToken,
      );

      organizations.push(
        ...pageOrganizations.map((organization) => ({
          login: organization.login,
        })),
      );

      if (pageOrganizations.length < perPage) {
        break;
      }
    }

    return organizations;
  }

  /**
   * Lists repositories owned by the user's organizations. Enumerating orgs
   * explicitly (`/user/orgs` → `/orgs/{org}/repos`) surfaces enterprise orgs
   * that `/user/repos` silently omits when SAML SSO or OAuth App restrictions
   * apply. Falls back to the `organization_member` affiliation filter when the
   * token cannot list organizations (e.g. a session predating `read:org`).
   */
  async listRepositories(
    accessToken: string,
  ): Promise<GithubRepositorySummary[]> {
    let organizations: GithubOrganizationSummary[];

    try {
      organizations = await this.listOrganizations(accessToken);
    } catch {
      return this.listAffiliatedRepositories(accessToken);
    }

    if (organizations.length === 0) {
      return this.listAffiliatedRepositories(accessToken);
    }

    const repositories: GithubRepositorySummary[] = [];
    let blockedOrganizations = 0;

    for (const organization of organizations) {
      try {
        repositories.push(
          ...(await this.listOrganizationRepositories(
            accessToken,
            organization.login,
          )),
        );
      } catch (error) {
        if (
          error instanceof AppError &&
          (error.statusCode === 403 || error.statusCode === 404)
        ) {
          blockedOrganizations += 1;
          continue;
        }

        throw error;
      }
    }

    if (repositories.length === 0 && blockedOrganizations > 0) {
      throw new AppError(
        "GitHub did not return repositories for your organizations. The OAuth App may need approval from an organization owner, or your token may need SAML SSO authorization. Open https://github.com/settings/connections/applications and authorize the app.",
        403,
      );
    }

    return repositories;
  }

  private async listOrganizationRepositories(
    accessToken: string,
    organization: string,
  ): Promise<GithubRepositorySummary[]> {
    const repositories: GithubRepositorySummary[] = [];
    const perPage = 100;
    const maxPages = 10;

    for (let page = 1; page <= maxPages; page += 1) {
      const pageRepositories = await this.request<GithubApiRepository[]>(
        `/orgs/${encodeURIComponent(organization)}/repos?type=all&per_page=${perPage}&sort=updated&page=${page}`,
        accessToken,
      );

      repositories.push(...pageRepositories.map(toRepositorySummary));

      if (pageRepositories.length < perPage) {
        break;
      }
    }

    return repositories;
  }

  private async listAffiliatedRepositories(
    accessToken: string,
  ): Promise<GithubRepositorySummary[]> {
    const repositories: GithubRepositorySummary[] = [];
    const perPage = 100;
    const maxPages = 10;

    for (let page = 1; page <= maxPages; page += 1) {
      const pageRepositories = await this.request<GithubApiRepository[]>(
        `/user/repos?affiliation=organization_member&type=all&per_page=${perPage}&sort=updated&page=${page}`,
        accessToken,
      );

      repositories.push(...pageRepositories.map(toRepositorySummary));

      if (pageRepositories.length < perPage) {
        break;
      }
    }

    return repositories;
  }

  async listBranches(
    accessToken: string,
    owner: string,
    repo: string,
  ): Promise<GithubBranchSummary[]> {
    const branches: GithubBranchSummary[] = [];
    const perPage = 100;
    const maxPages = 10;

    for (let page = 1; page <= maxPages; page += 1) {
      const pageBranches = await this.request<GithubApiBranch[]>(
        `/repos/${owner}/${repo}/branches?per_page=${perPage}&page=${page}`,
        accessToken,
      );

      branches.push(...pageBranches.map((branch) => ({ name: branch.name })));

      if (pageBranches.length < perPage) {
        break;
      }
    }

    return branches;
  }

  async compareBranches(
    accessToken: string,
    owner: string,
    repo: string,
    base: string,
    head: string,
  ): Promise<GithubBranchComparison> {
    const comparison = await this.request<GithubApiComparison>(
      `/repos/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`,
      accessToken,
    );

    return {
      status: comparison.status,
      aheadBy: comparison.ahead_by ?? 0,
      behindBy: comparison.behind_by ?? 0,
      commits: (comparison.commits ?? []).map((commit) =>
        this.toCommitSummary(commit),
      ),
    };
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

    return commits.map((commit) => this.toCommitSummary(commit));
  }

  private toCommitSummary(commit: GithubApiCommit): GithubCommitSummary {
    return {
      sha: commit.sha,
      message: commit.commit.message.split("\n")[0] ?? "",
      authorLogin: commit.author?.login ?? null,
      authorName: commit.commit.author?.name ?? null,
      committedAt: new Date(commit.commit.author?.date ?? Date.now()),
      url: commit.html_url,
    };
  }
}
