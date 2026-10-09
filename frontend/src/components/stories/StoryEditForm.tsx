import { useState, type FormEvent } from "react";
import { ApiError } from "../../api/http";
import type { UpdateStoryInput } from "../../api/stories";
import { STORY_PRIORITY_LABELS } from "../../domain/story";
import {
  STORY_POINTS,
  STORY_PRIORITIES,
  type Sprint,
  type Story,
  type StoryPoints,
  type StoryPriority,
} from "../../domain/types";
import { Button } from "../shared/Button/Button";
import { Select } from "../shared/Select/Select";
import { TextInput } from "../shared/TextInput/TextInput";
import styles from "./StoryEditForm.module.css";

const NO_SPRINT = "";

function isStoryPriority(value: string): value is StoryPriority {
  return (STORY_PRIORITIES as readonly string[]).includes(value);
}

interface StoryEditFormProps {
  story: Story;
  sprints: Sprint[];
  onSave: (input: UpdateStoryInput) => Promise<void>;
  onMoveToSprint: (sprintId: string | null) => Promise<void>;
}

export function StoryEditForm({
  story,
  sprints,
  onSave,
  onMoveToSprint,
}: StoryEditFormProps) {
  const [title, setTitle] = useState(story.title);
  const [storyPoints, setStoryPoints] = useState(String(story.storyPoints));
  const [priority, setPriority] = useState<StoryPriority>(story.priority);
  const [sprintId, setSprintId] = useState(story.sprintId ?? NO_SPRINT);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const trimmedTitle = title.trim();
  const sprintOptions = [
    { value: NO_SPRINT, label: "No sprint" },
    ...sprints.map((sprint) => ({ value: sprint.id, label: sprint.name })),
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedTitle) {
      setTitleError("The title is required.");
      return;
    }

    setTitleError(null);
    setFormError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      await onSave({
        title: trimmedTitle,
        storyPoints: Number(storyPoints) as StoryPoints,
        priority,
      });

      if ((story.sprintId ?? NO_SPRINT) !== sprintId) {
        await onMoveToSprint(sprintId === NO_SPRINT ? null : sprintId);
      }

      setMessage("Story updated.");
    } catch (caught) {
      setFormError(
        caught instanceof ApiError
          ? caught.message
          : "Could not update the story.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextInput
        id="edit-story-title"
        label="Story name"
        value={title}
        onChange={setTitle}
        placeholder="As a user, I want…"
        error={titleError ?? undefined}
      />

      <div className={styles.row}>
        <Select
          id="edit-story-points"
          label="Story points"
          value={storyPoints}
          options={STORY_POINTS.map((points) => ({
            value: String(points),
            label: String(points),
          }))}
          onChange={setStoryPoints}
        />
        <Select
          id="edit-story-priority"
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

      <Select
        id="edit-story-sprint"
        label="Sprint"
        value={sprintId}
        options={sprintOptions}
        onChange={setSprintId}
      />

      {formError ? (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      ) : null}

      {message ? (
        <p className={styles.message} role="status">
          {message}
        </p>
      ) : null}

      <div className={styles.actions}>
        <Button type="submit" disabled={isSaving || !trimmedTitle}>
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
