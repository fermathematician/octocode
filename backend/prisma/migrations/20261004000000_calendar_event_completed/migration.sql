-- Adds a local-only "done" flag for calendar tasks. Google Calendar has no
-- equivalent property, so the Google sync never reads or writes it.
ALTER TABLE "CalendarEvent" ADD COLUMN "completed" BOOLEAN NOT NULL DEFAULT false;
