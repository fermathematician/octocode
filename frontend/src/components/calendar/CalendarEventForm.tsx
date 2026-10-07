import { useState, type FormEvent } from "react";
import type { CreateCalendarEventInput } from "../../api/calendar-events";
import { CALENDAR_EVENT_TYPE_LABELS } from "../../domain/calendar";
import {
  CALENDAR_EVENT_TYPES,
  type CalendarEvent,
  type CalendarEventType,
} from "../../domain/types";
import { Button } from "../shared/Button/Button";
import { Select } from "../shared/Select/Select";
import { TextInput } from "../shared/TextInput/TextInput";
import {
  isCalendarEventType,
  validateCalendarEvent,
  type CalendarEventFormErrors,
} from "./calendar-event.schema";
import styles from "./CalendarEventForm.module.css";

interface CalendarEventFormProps {
  defaultDate: string;
  onSubmit: (input: CreateCalendarEventInput) => Promise<void>;
  initialEvent?: CalendarEvent;
  onCancel?: () => void;
}

export function CalendarEventForm({
  defaultDate,
  onSubmit,
  initialEvent,
  onCancel,
}: CalendarEventFormProps) {
  const isEditing = initialEvent !== undefined;
  const [type, setType] = useState<CalendarEventType>(
    initialEvent?.type ?? "task",
  );
  const [title, setTitle] = useState(initialEvent?.title ?? "");
  const [date, setDate] = useState(initialEvent?.date ?? defaultDate);
  const [startTime, setStartTime] = useState(initialEvent?.startTime ?? "09:00");
  const [errors, setErrors] = useState<CalendarEventFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateCalendarEvent({
      type,
      title,
      date,
      startTime,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({ type, title: title.trim(), date, startTime });
      if (!isEditing) {
        setTitle("");
      }
    } catch {
      setFormError(
        isEditing
          ? "Unable to save the event. Please try again."
          : "Unable to add the event. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <Select
        id="event-type"
        label="Type"
        value={type}
        options={CALENDAR_EVENT_TYPES.map((value) => ({
          value,
          label: CALENDAR_EVENT_TYPE_LABELS[value],
        }))}
        onChange={(value) => {
          if (isCalendarEventType(value)) {
            setType(value);
          }
        }}
      />

      <TextInput
        id="event-title"
        label="Title"
        value={title}
        onChange={setTitle}
        placeholder="Code review with the team"
        error={errors.title}
      />

      <div className={styles.row}>
        <TextInput
          id="event-date"
          label="Date"
          type="date"
          value={date}
          onChange={setDate}
          error={errors.date}
        />
        <TextInput
          id="event-time"
          label="Start time"
          type="time"
          value={startTime}
          onChange={setStartTime}
          error={errors.startTime}
        />
      </div>

      {formError ? (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      ) : null}

      <div className={styles.actions}>
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? isEditing
              ? "Saving…"
              : "Adding…"
            : isEditing
              ? "Save changes"
              : "Add event"}
        </Button>
      </div>
    </form>
  );
}
