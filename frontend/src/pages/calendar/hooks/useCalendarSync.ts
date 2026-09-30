import { useCallback, useEffect, useState } from "react";
import {
  disconnectGoogle,
  getCalendarSyncStatus,
  syncGoogleCalendar,
  type CalendarSyncStatus,
} from "../../../api/google-calendar";
import { ApiError } from "../../../api/http";

interface UseCalendarSyncResult {
  status: CalendarSyncStatus | null;
  loading: boolean;
  busy: boolean;
  message: string | null;
  sync: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export function useCalendarSync(): UseCalendarSyncResult {
  const [status, setStatus] = useState<CalendarSyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await getCalendarSyncStatus();
        if (!cancelled) {
          setStatus(result);
        }
      } catch {
        if (!cancelled) {
          setStatus(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const sync = useCallback(async () => {
    setBusy(true);
    setMessage(null);

    try {
      const result = await syncGoogleCalendar();
      setMessage(
        `Synced: ${result.pulled} pulled, ${result.pushed} pushed, ${result.deleted} removed.`,
      );
      setStatus(await getCalendarSyncStatus());
    } catch (error) {
      setMessage(
        error instanceof ApiError ? error.message : "Calendar sync failed.",
      );
    } finally {
      setBusy(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setBusy(true);
    setMessage(null);

    try {
      await disconnectGoogle();
      setStatus({ connected: false, lastSyncedAt: null });
      setMessage("Google Calendar disconnected.");
    } catch (error) {
      setMessage(
        error instanceof ApiError ? error.message : "Unable to disconnect.",
      );
    } finally {
      setBusy(false);
    }
  }, []);

  return { status, loading, busy, message, sync, disconnect };
}
