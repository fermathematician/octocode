import { useState, type FormEvent } from "react";
import { Button } from "../../../components/shared/Button/Button";
import { Select } from "../../../components/shared/Select/Select";
import { TextInput } from "../../../components/shared/TextInput/TextInput";
import { STORY_PRIORITY_LABELS } from "../../../domain/story";
import {
  STORY_POINTS,
  STORY_PRIORITIES,
  type Project,
  type StoryPoints,
  type StoryPriority,
} from "../../../domain/types";
import type { CreateStoryInput } from "../../../api/stories";
import { useProjectBranches } from "../hooks/useProjectBranches";
import { BranchPicker } from "./BranchPicker";
import {
  isStoryPoints,
  isStoryPriority,
  validateCreateStory,
  type CreateStoryFormErrors,
} from "../validation/story-form.schema";
import styles from "./CreateStoryForm.module.css";

interface CreateStoryFormProps {
  projects: Project[];
  defaultProjectId: string | null;
  onSubmit: (input: CreateStoryInput) => Promise<void>;
  onCancel: () => void;
}

const DEFAULT_POINTS: StoryPoints = 3;

export function CreateStoryForm({
  projects,
  defaultProjectId,
  onSubmit,
  onCancel,
}: CreateStoryFormProps) {
  const [projectId, setProjectId] = useState(
    defaultProjectId ?? projects[0]?.id ?? "",
  );
  const [title, setTitle] = useState("");
  const [branch, setBranch] = useState("");
  const [storyPoints, setStoryPoints] = useState<string>(String(DEFAULT_POINTS));
  const [priority, setPriority] = useState<StoryPriority>("medium");
  const [errors, setErrors] = useState<CreateStoryFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const points = isStoryPoints(storyPoints)
    ? (Number(storyPoints) as StoryPoints)
    : DEFAULT_POINTS;

  const { branches } = useProjectBranches(projectId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateCreateStory({
      projectId,
      title,
      storyPoints: points,
      priority,
      branch,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        projectId,
        title: title.trim(),
        storyPoints: points,
        priority,
        branch: branch.trim(),
      });
    } catch {
      setFormError("Unable to create the story. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <Select
        id="create-story-project"
        label="Project"
        value={projectId}
        options={projects.map((project) => ({
          value: project.id,
          label: project.name,
        }))}
        onChange={setProjectId}
        error={errors.projectId}
      />

      <TextInput
        id="create-story-title"
        label="Story name"
        value={title}
        onChange={setTitle}
        placeholder="As a user, I want…"
        error={errors.title}
      />

      <BranchPicker
        id="create-story-branch"
        label="Branch"
        value={branch}
        onChange={setBranch}
        branches={branches}
        placeholder="feat/my-story"
        error={errors.branch}
      />

      <div className={styles.row}>
        <Select
          id="create-story-points"
          label="Story points"
          value={storyPoints}
          options={STORY_POINTS.map((points) => ({
            value: String(points),
            label: String(points),
          }))}
          onChange={setStoryPoints}
        />
        <Select
          id="create-story-priority"
          label="Priority"
          value={priority}
          options={STORY_PRIORITIES.map((value) => ({
            value,
            label: STORY_PRIORITY_LABELS[value],
          }))}
          onChange={(value) => {
            if (isStoryPriority(value)) {
              setPriority(value);
            }
          }}
        />
      </div>

      {formError ? (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      ) : null}

      <div className={styles.actions}>
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create story"}
        </Button>
      </div>
    </form>
  );
}
