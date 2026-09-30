import { useState, type FormEvent } from "react";
import { Button } from "../../../components/shared/Button/Button";
import { TextInput } from "../../../components/shared/TextInput/TextInput";
import type { ReminderInput } from "../hooks/useTodayAgenda";
import {
  validateReminder,
  type ReminderFormErrors,
} from "../validation/reminder.schema";
import styles from "./ReminderForm.module.css";

interface ReminderFormProps {
  onSubmit: (input: ReminderInput) => Promise<void>;
}

export function ReminderForm({ onSubmit }: ReminderFormProps) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [errors, setErrors] = useState<ReminderFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateReminder({ title, startTime });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({ title: title.trim(), startTime });
      setTitle("");
    } catch {
      setFormError("Unable to add the reminder. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextInput
        id="reminder-title"
        label="Reminder"
        value={title}
        onChange={setTitle}
        placeholder="Renew domain registration"
        error={errors.title}
      />
      <TextInput
        id="reminder-time"
        label="Time"
        type="time"
        value={startTime}
        onChange={setStartTime}
        error={errors.startTime}
      />

      {formError ? (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      ) : null}

      <div className={styles.actions}>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding…" : "Add reminder"}
        </Button>
      </div>
    </form>
  );
}
