import { useState, type FormEvent } from "react";
import { ApiError } from "../../api/http";
import type { UpdateProjectInput } from "../../api/projects";
import type { Project } from "../../domain/types";
import { Button } from "../shared/Button/Button";
import { Modal } from "../shared/Modal/Modal";
import { TextInput } from "../shared/TextInput/TextInput";
import styles from "./ProjectEditModal.module.css";

interface ProjectEditModalProps {
  project: Project;
  onSave: (input: UpdateProjectInput) => Promise<void>;
  onClose: () => void;
}

export function ProjectEditModal({
  project,
  onSave,
  onClose,
}: ProjectEditModalProps) {
  const [name, setName] = useState(project.name);
  const [color, setColor] = useState(project.color);
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedName = name.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedName) {
      setNameError("The project name is required.");
      return;
    }

    setNameError(null);
    setFormError(null);
    setIsSubmitting(true);

    try {
      await onSave({ name: trimmedName, color });
    } catch (caught) {
      setFormError(
        caught instanceof ApiError
          ? caught.message
          : "Unable to update the project.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Edit project" onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextInput
          id="edit-project-name"
          label="Project name"
          value={name}
          onChange={setName}
          placeholder={project.name}
          error={nameError ?? undefined}
        />

        <TextInput
          id="edit-project-color"
          label="Color"
          type="color"
          value={color}
          onChange={setColor}
        />

        {formError ? (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        ) : null}

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !trimmedName}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
