export interface GoogleToken {
  accessToken: string;
  refreshToken: string | null;
  scope: string;
  tokenType: string | null;
  expiresAt: Date | null;
}

export interface GoogleEventTime {
  dateTime?: string | null;
  date?: string | null;
  timeZone?: string | null;
}

export interface GoogleCalendarEvent {
  id: string;
  status: string;
  summary?: string | null;
  description?: string | null;
  start: GoogleEventTime;
  end: GoogleEventTime;
  attendees?: Array<unknown> | null;
  updated?: string | null;
  extendedProperties?: { private?: Record<string, string> } | null;
}

export interface GoogleEventInput {
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  privateProperties: Record<string, string>;
}

export interface GoogleEventListResult {
  events: GoogleCalendarEvent[];
  nextSyncToken: string | null;
}

export interface GoogleCalendarClient {
  getAuthorizeUrl(state: string): string;
  exchangeCodeForToken(code: string): Promise<GoogleToken>;
  refreshAccessToken(refreshToken: string): Promise<GoogleToken>;
  listEvents(
    accessToken: string,
    calendarId: string,
    syncToken: string | null,
  ): Promise<GoogleEventListResult>;
  createEvent(
    accessToken: string,
    calendarId: string,
    input: GoogleEventInput,
  ): Promise<GoogleCalendarEvent>;
  updateEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    input: GoogleEventInput,
  ): Promise<GoogleCalendarEvent>;
  deleteEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
  ): Promise<void>;
}
