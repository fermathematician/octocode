import { env } from "../config/env.js";
import { SessionProvider } from "../infrastructure/auth/SessionProvider.js";
import { TokenCipher } from "../infrastructure/auth/TokenCipher.js";
import { FetchGithubClient } from "../infrastructure/github/FetchGithubClient.js";
import { prisma } from "../infrastructure/prisma/client.js";
import { PrismaOAuthAccountRepository } from "../modules/auth/repositories/OAuthAccountRepository.js";
import { PrismaUserRepository } from "../modules/auth/repositories/UserRepository.js";
import { PrismaCalendarEventRepository } from "../modules/calendar/repositories/CalendarEventRepository.js";
import { PrismaCommitRepository } from "../modules/github/repositories/CommitRepository.js";
import { PrismaGithubRepositoryRepository } from "../modules/github/repositories/GithubRepositoryRepository.js";
import { PrismaProjectRepository } from "../modules/projects/repositories/ProjectRepository.js";
import { PrismaSprintRepository } from "../modules/sprints/repositories/SprintRepository.js";
import { PrismaStoryRepository } from "../modules/stories/repositories/StoryRepository.js";

export const tokenCipher = new TokenCipher(env.tokenEncryptionKey);

export const sessionProvider = new SessionProvider(
  prisma,
  env.session.ttlDays,
);

export const githubClient = new FetchGithubClient({
  clientId: env.github.clientId,
  clientSecret: env.github.clientSecret,
  callbackUrl: env.github.callbackUrl,
});

export const userRepository = new PrismaUserRepository(prisma);
export const oauthAccountRepository = new PrismaOAuthAccountRepository(prisma);
export const projectRepository = new PrismaProjectRepository(prisma);
export const sprintRepository = new PrismaSprintRepository(prisma);
export const storyRepository = new PrismaStoryRepository(prisma);
export const calendarEventRepository = new PrismaCalendarEventRepository(prisma);
export const githubRepositoryRepository = new PrismaGithubRepositoryRepository(
  prisma,
);
export const commitRepository = new PrismaCommitRepository(prisma);
