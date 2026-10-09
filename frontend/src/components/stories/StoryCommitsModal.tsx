import { useState } from "react";
import { ApiError } from "../../api/http";
import type { UpdateStoryInput } from "../../api/stories";
import type { Sprint, Story } from "../../domain/types";
import { Button } from "../shared/Button/Button";
import { Modal } from "../shared/Modal/Modal";
import { CommitList } from "./CommitList";
import { StoryEditForm } from "./StoryEditForm";
import styles from "./StoryCommitsModal.module.css";

interface StoryCommitsModalProps {
  story: Story;
  projectName?: string;
  sprints: Sprint[];
  onClose: () => void;
  onSyncCommits: () => Promise<void>;
  onUpdateStory: (input: UpdateStoryInput) => Promise<void>;
  onMoveToSprint: (sprintId: string | null) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function StoryCommitsModal({
  story,
  projectName,
  sprints,
  onClose,
  onSyncCommits,
  onUpdateStory,
  onMoveToSprint,
  onDelete,
}: StoryCommitsModalProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete "${story.title}"? Its commits stay in the repository.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await onDelete();
    } catch (caught) {
      setDeleteError(
        caught instanceof ApiError
          ? caught.message
          : "Could not delete the story.",
      );
      setIsDeleting(false);
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
          <h3 className={styles.sectionTitle}>Edit story</h3>
          <StoryEditForm
            key={story.id}
            story={story}
            sprints={sprints}
            onSave={onUpdateStory}
            onMoveToSprint={onMoveToSprint}
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

        <section className={styles.danger}>
          <div>
            <h3 className={styles.sectionTitle}>Delete story</h3>
            <p className={styles.dangerHint}>
              Removes the story. Its commits stay in the repository.
            </p>
          </div>
          <Button
            variant="danger"
            disabled={isDeleting}
            onClick={() => {
              void handleDelete();
            }}
          >
            {isDeleting ? "Deleting…" : "Delete story"}
          </Button>
        </section>
        {deleteError ? (
          <p className={styles.message} role="alert">
            {deleteError}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
