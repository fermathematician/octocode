import type { SessionProvider } from "../../../infrastructure/auth/SessionProvider.js";

export class LogoutAllService {
  constructor(private readonly sessions: SessionProvider) {}

  async execute(userId: string): Promise<number> {
    return this.sessions.revokeAllForUser(userId);
  }
}
