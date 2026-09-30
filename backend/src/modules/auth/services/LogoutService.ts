import type { SessionProvider } from "../../../infrastructure/auth/SessionProvider.js";

export class LogoutService {
  constructor(private readonly sessions: SessionProvider) {}

  async execute(sessionToken: string | undefined): Promise<void> {
    if (sessionToken) {
      await this.sessions.revoke(sessionToken);
    }
  }
}
