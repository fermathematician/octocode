import { useState } from "react";
import { ApiError } from "../../api/http";
import type { UpdateStoryInput } from "../../api/stories";
import type { Story } from "../../domain/types";
import { Button } from "../shared/Button/Button";
import { Modal } from "../shared/Modal/Modal";
import { CommitList } from "./CommitList";
import { StoryPointsEditor } from "./StoryPointsEditor";
import styles from "./StoryCommitsModal.module.css";

interface StoryCommitsModalProps {
  story: Story;
  projectName?: string;
  onClose: () => void;
  onSyncCommits: () => Promise<void>;
  onUpdateStory: (input: UpdateStoryInput) => Promise<void>;
}

export function StoryCommitsModal({
  story,
  projectName,
  onClose,
  onSyncCommits,
  onUpdateStory,
}: StoryCommitsModalProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setIsSyncing(true);
    setMessage(null);

    try {
      await onSyncCommits();
      setMessage("Commits synced.");
    } catch (caught) {
      setMessage(
        caught instanceof ApiError
          ? caught.message
          : "Could not sync commits. Check that the project has a linked repository.",
      );
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <Modal title={story.title} onClose={onClose}>
      <div className={styles.body}>
        {projectName ? (
          <span className={styles.project}>{projectName}</span>
        ) : null}

        <dl className={styles.properties}>
          <div className={styles.property}>
            <dt>Branch</dt>
            <dd>
              <code className={styles.branch}>{story.branch}</code>
            </dd>
          </div>
        </dl>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Story points</h3>
          <StoryPointsEditor
            key={story.id}
            storyPoints={story.storyPoints}
            onSave={(storyPoints) => onUpdateStory({ storyPoints })}
          />
        </section>

        <div className={styles.actions}>
          <Button
            variant="secondary"
            disabled={isSyncing}
            onClick={() => {
              void handleSync();
            }}
          >
            {isSyncing ? "Syncing…" : "Sync commits"}
          </Button>
          {message ? (
            <span className={styles.message} role="status">
              {message}
            </span>
          ) : null}
        </div>

        <CommitList commits={story.commits} />
      </div>
    </Modal>
  );
}
