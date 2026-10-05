import { useState, type FormEvent } from "react";
import { ApiError } from "../../api/http";
import { createSprint } from "../../api/sprints";
import { addDays, parseIsoDate, todayIso, toIsoDate } from "../../shared/date";
import { Button } from "../shared/Button/Button";
import { Modal } from "../shared/Modal/Modal";
import { TextInput } from "../shared/TextInput/TextInput";
import styles from "./CreateSprintModal.module.css";

interface CreateSprintModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function defaultEndDate(): string {
  return toIsoDate(addDays(parseIsoDate(todayIso()), 6));
}

export function CreateSprintModal({
  onClose,
  onCreated,
}: CreateSprintModalProps) {
  const [name, setName] = useState("Sprint");
  const [startDate, setStartDate] = useState(() => todayIso());
  const [endDate, setEndDate] = useState(() => defaultEndDate());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasValidRange = !startDate || !endDate || endDate >= startDate;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !startDate || !endDate) {
      setError("Name, start date and end date are required.");
      return;
    }

    if (endDate < startDate) {
      setError("The end date cannot be before the start date.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await createSprint({ name: name.trim(), startDate, endDate });
      onCreated();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Unable to generate the sprint.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Generate sprint" onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextInput
          id="sprint-name"
          label="Sprint name"
          value={name}
          onChange={setName}
          placeholder="Sprint 1"
        />

        <TextInput
          id="sprint-start"
          label="Start date"
          type="date"
          value={startDate}
          onChange={setStartDate}
        />

        <TextInput
          id="sprint-end"
          label="End date"
          type="date"
          value={endDate}
          onChange={setEndDate}
          error={
            hasValidRange
              ? undefined
              : "The end date cannot be before the start date."
          }
        />

        <p className={styles.hint}>
          Sprints can be any length — pick both dates.
        </p>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !hasValidRange}>
            {isSubmitting ? "Generating…" : "Generate sprint"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
