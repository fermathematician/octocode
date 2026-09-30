import { randomBytes } from "node:crypto";
import type { GoogleCalendarClient } from "../../../infrastructure/google/GoogleCalendarClient.js";

export interface StartGoogleLinkResult {
  state: string;
  authorizeUrl: string;
}

export class StartGoogleLinkService {
  constructor(private readonly googleClient: GoogleCalendarClient) {}

  execute(): StartGoogleLinkResult {
    const state = randomBytes(16).toString("base64url");

    return {
      state,
      authorizeUrl: this.googleClient.getAuthorizeUrl(state),
    };
  }
}
