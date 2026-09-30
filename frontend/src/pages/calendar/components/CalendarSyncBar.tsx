import { startGoogleLink } from "../../../api/google-calendar";
import { Button } from "../../../components/shared/Button/Button";
import { useCalendarSync } from "../hooks/useCalendarSync";
import styles from "./CalendarSyncBar.module.css";

interface CalendarSyncBarProps {
  onDataChanged: () => void;
}

export function CalendarSyncBar({ onDataChanged }: CalendarSyncBarProps) {
  const { status, loading, busy, message, sync, disconnect } =
    useCalendarSync();

  if (loading) {
    return null;
  }

  const connected = status?.connected ?? false;

  return (
    <div className={styles.bar}>
      <div className={styles.info}>
        <span className={styles.status}>
          <span
            className={`${styles.dot} ${
              connected ? styles.dotOn : styles.dotOff
            }`}
            aria-hidden="true"
          />
          {connected
            ? "Google Calendar connected"
            : "Google Calendar not connected"}
        </span>
        {connected && status?.lastSyncedAt ? (
          <span className={styles.meta}>
            Last synced {new Date(status.lastSyncedAt).toLocaleString()}
          </span>
        ) : null}
        {message ? <span className={styles.message}>{message}</span> : null}
      </div>

      <div className={styles.actions}>
        {connected ? (
          <>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                void sync().then(onDataChanged);
              }}
            >
              {busy ? "Syncing…" : "Sync now"}
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                void disconnect().then(onDataChanged);
              }}
            >
              Disconnect
            </Button>
          </>
        ) : (
          <Button onClick={startGoogleLink}>Connect Google Calendar</Button>
        )}
      </div>
    </div>
  );
}
