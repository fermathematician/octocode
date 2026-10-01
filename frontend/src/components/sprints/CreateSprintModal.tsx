import { useState, type FormEvent } from "react";
import { ApiError } from "../../api/http";
import { createSprint } from "../../api/sprints";
import type { Project } from "../../domain/types";
import { todayIso } from "../../shared/date";
import { Button } from "../shared/Button/Button";
import { Modal } from "../shared/Modal/Modal";
import { Select } from "../shared/Select/Select";
import { TextInput } from "../shared/TextInput/TextInput";
import styles from "./CreateSprintModal.module.css";

interface CreateSprintModalProps {
  projects: Project[];
  defaultProjectId: string | null;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateSprintModal({
  projects,
  defaultProjectId,
  onClose,
  onCreated,
}: CreateSprintModalProps) {
  const [projectId, setProjectId] = useState(
    defaultProjectId ?? projects[0]?.id ?? "",
  );
  const [name, setName] = useState("Sprint");
  const [startDate, setStartDate] = useState(() => todayIso());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!projectId || !name.trim() || !startDate) {
      setError("Project, name and start date are required.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await createSprint({ projectId, name: name.trim(), startDate });
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
        <Select
          id="sprint-project"
          label="Project"
          value={projectId}
          options={projects.map((project) => ({
            value: project.id,
            label: project.name,
          }))}
          onChange={setProjectId}
        />

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

        <p className={styles.hint}>
          Sprints last one week: the start date plus 6 days.
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
          <Button type="submit" disabled={isSubmitting || !projectId}>
            {isSubmitting ? "Generating…" : "Generate sprint"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
