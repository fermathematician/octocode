import { useState } from "react";
import { ApiError } from "../../api/http";
import { STORY_POINTS, type StoryPoints } from "../../domain/types";
import { Button } from "../shared/Button/Button";
import { Select } from "../shared/Select/Select";
import styles from "./StoryPointsEditor.module.css";

interface StoryPointsEditorProps {
  storyPoints: StoryPoints;
  onSave: (storyPoints: StoryPoints) => Promise<void>;
}

export function StoryPointsEditor({
  storyPoints,
  onSave,
}: StoryPointsEditorProps) {
  const [value, setValue] = useState(String(storyPoints));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = Number(value) as StoryPoints;
  const isDirty = selected !== storyPoints;

  async function handleSave() {
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      await onSave(selected);
      setMessage("Story points updated.");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not update the story points.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.editor}>
      <div className={styles.controls}>
        <Select
          id="story-points-editor"
          label="Story points"
          value={value}
          options={STORY_POINTS.map((points) => ({
            value: String(points),
            label: String(points),
          }))}
          onChange={setValue}
        />
        <Button
          variant="secondary"
          disabled={isSaving || !isDirty}
          onClick={() => {
            void handleSave();
          }}
        >
          {isSaving ? "Saving…" : "Update points"}
        </Button>
      </div>
      {message ? (
        <p className={styles.message} role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
