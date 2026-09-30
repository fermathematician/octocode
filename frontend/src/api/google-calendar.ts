import { apiFetch, getApiBaseUrl } from "./http";

export interface CalendarSyncStatus {
  connected: boolean;
  lastSyncedAt: string | null;
}

export interface CalendarSyncResult {
  pulled: number;
  pushed: number;
  deleted: number;
  lastSyncedAt: string;
}

export function getCalendarSyncStatus(): Promise<CalendarSyncStatus> {
  return apiFetch<CalendarSyncStatus>("/calendar/google/status");
}

export function startGoogleLink(): void {
  window.location.href = `${getApiBaseUrl()}/calendar/google`;
}

export function disconnectGoogle(): Promise<void> {
  return apiFetch<void>("/calendar/google", { method: "DELETE" });
}

export function syncGoogleCalendar(): Promise<CalendarSyncResult> {
  return apiFetch<CalendarSyncResult>("/calendar/google/sync", {
    method: "POST",
  });
}
