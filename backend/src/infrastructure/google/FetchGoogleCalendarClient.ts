import { AppError } from "../../shared/appError.js";
import { GoogleApiError, GoogleSyncTokenExpiredError } from "./GoogleApiError.js";
import type {
  GoogleCalendarClient,
  GoogleCalendarEvent,
  GoogleEventInput,
  GoogleEventListResult,
  GoogleToken,
} from "./GoogleCalendarClient.js";

interface FetchGoogleCalendarClientOptions {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

const AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API_BASE = "https://www.googleapis.com/calendar/v3";
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

interface GoogleTokenResponse {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
}

export class FetchGoogleCalendarClient implements GoogleCalendarClient {
  constructor(private readonly options: FetchGoogleCalendarClientOptions) {}

  private assertConfigured(): void {
    if (!this.options.clientId || !this.options.clientSecret) {
      throw new AppError("Google Calendar OAuth is not configured.", 503);
    }
  }

  getAuthorizeUrl(state: string): string {
    this.assertConfigured();

    const params = new URLSearchParams({
      client_id: this.options.clientId,
      redirect_uri: this.options.callbackUrl,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state,
    });

    return `${AUTH_BASE}?${params.toString()}`;
  }

  private async tokenRequest(
    body: Record<string, string>,
  ): Promise<GoogleToken> {
    this.assertConfigured();

    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body).toString(),
    });

    const data = (await response.json().catch(() => ({}))) as GoogleTokenResponse;

    if (!response.ok || !data.access_token) {
      throw new AppError(
        `Google token request failed${data.error ? `: ${data.error}` : "."}`,
        401,
      );
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      scope: data.scope ?? "",
      tokenType: data.token_type ?? null,
      expiresAt:
        data.expires_in !== undefined
          ? new Date(Date.now() + data.expires_in * 1000)
          : null,
    };
  }

  exchangeCodeForToken(code: string): Promise<GoogleToken> {
    return this.tokenRequest({
      code,
      client_id: this.options.clientId,
      client_secret: this.options.clientSecret,
      redirect_uri: this.options.callbackUrl,
      grant_type: "authorization_code",
    });
  }

  refreshAccessToken(refreshToken: string): Promise<GoogleToken> {
    return this.tokenRequest({
      refresh_token: refreshToken,
      client_id: this.options.clientId,
      client_secret: this.options.clientSecret,
      grant_type: "refresh_token",
    });
  }

  private async request<T>(
    path: string,
    accessToken: string,
    init: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });

    if (response.status === 410) {
      throw new GoogleSyncTokenExpiredError();
    }

    if (response.status === 204) {
      return undefined as T;
    }

    if (!response.ok) {
      throw new GoogleApiError(
        response.status,
        `Google Calendar request failed with status ${response.status}.`,
      );
    }

    return (await response.json()) as T;
  }

  async listEvents(
    accessToken: string,
    calendarId: string,
    syncToken: string | null,
  ): Promise<GoogleEventListResult> {
    const events: GoogleCalendarEvent[] = [];
    let pageToken: string | undefined;
    let nextSyncToken: string | null = null;

    const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

    do {
      const params = new URLSearchParams({
        maxResults: "250",
        showDeleted: "true",
      });

      if (syncToken) {
        params.set("syncToken", syncToken);
      } else {
        params.set("singleEvents", "true");
        params.set("orderBy", "startTime");
        params.set("timeMin", timeMin);
        params.set("timeMax", timeMax);
      }

      if (pageToken) {
        params.set("pageToken", pageToken);
      }

      const page = await this.request<{
        items?: GoogleCalendarEvent[];
        nextPageToken?: string;
        nextSyncToken?: string;
      }>(
        `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
        accessToken,
      );

      events.push(...(page.items ?? []));
      pageToken = page.nextPageToken;

      if (page.nextSyncToken) {
        nextSyncToken = page.nextSyncToken;
      }
    } while (pageToken);

    return { events, nextSyncToken };
  }

  createEvent(
    accessToken: string,
    calendarId: string,
    input: GoogleEventInput,
  ): Promise<GoogleCalendarEvent> {
    return this.request<GoogleCalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      accessToken,
      { method: "POST", body: JSON.stringify(toGoogleBody(input)) },
    );
  }

  updateEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    input: GoogleEventInput,
  ): Promise<GoogleCalendarEvent> {
    return this.request<GoogleCalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      accessToken,
      { method: "PATCH", body: JSON.stringify(toGoogleBody(input)) },
    );
  }

  async deleteEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
  ): Promise<void> {
    try {
      await this.request<void>(
        `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        accessToken,
        { method: "DELETE" },
      );
    } catch (error) {
      // Already gone upstream.
      if (error instanceof GoogleApiError && (error.status === 404 || error.status === 410)) {
        return;
      }

      throw error;
    }
  }
}

function toGoogleBody(input: GoogleEventInput) {
  return {
    summary: input.summary,
    description: input.description,
    start: input.start,
    end: input.end,
    extendedProperties: { private: input.privateProperties },
  };
}
