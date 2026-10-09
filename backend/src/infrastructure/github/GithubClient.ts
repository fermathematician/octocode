export interface GithubUser {
  id: string;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export interface GithubToken {
  accessToken: string;
  scope: string;
  tokenType: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
}

export interface GithubRepositorySummary {
  repoId: string;
  owner: string;
  name: string;
  defaultBranch: string;
  isPrivate: boolean;
}

export interface GithubOrganizationSummary {
  login: string;
}

export interface GithubCommitSummary {
  sha: string;
  message: string;
  authorLogin: string | null;
  authorName: string | null;
  committedAt: Date;
  url: string | null;
}

export interface GithubBranchSummary {
  name: string;
}

export interface GithubBranchComparison {
  status: string;
  aheadBy: number;
  behindBy: number;
  /** Commits reachable from `head` but not from `base`. */
  commits: GithubCommitSummary[];
}

export interface GithubClient {
  getAuthorizeUrl(state: string): string;
  exchangeCodeForToken(code: string): Promise<GithubToken>;
  getAuthenticatedUser(accessToken: string): Promise<GithubUser>;
  listOrganizations(accessToken: string): Promise<GithubOrganizationSummary[]>;
  listRepositories(accessToken: string): Promise<GithubRepositorySummary[]>;
  listBranches(
    accessToken: string,
    owner: string,
    repo: string,
  ): Promise<GithubBranchSummary[]>;
  compareBranches(
    accessToken: string,
    owner: string,
    repo: string,
    base: string,
    head: string,
  ): Promise<GithubBranchComparison>;
  listCommits(
    accessToken: string,
    owner: string,
    repo: string,
    branch: string,
  ): Promise<GithubCommitSummary[]>;
}
