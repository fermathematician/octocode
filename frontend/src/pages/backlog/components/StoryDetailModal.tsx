import { useState } from "react";
import { ApiError } from "../../../api/http";
import type { UpdateStoryInput } from "../../../api/stories";
import { Badge, type BadgeTone } from "../../../components/shared/Badge/Badge";
import { Button } from "../../../components/shared/Button/Button";
import { Modal } from "../../../components/shared/Modal/Modal";
import { CommitList } from "../../../components/stories/CommitList";
import { StoryEditForm } from "../../../components/stories/StoryEditForm";
import {
  STORY_PRIORITY_LABELS,
  STORY_STATUS_LABELS,
} from "../../../domain/story";
import type { Project, Sprint, Story } from "../../../domain/types";
import { BranchForm } from "./BranchForm";
import styles from "./StoryDetailModal.module.css";

interface StoryDetailModalProps {
  story: Story;
  project: Project | undefined;
  sprints: Sprint[];
  onClose: () => void;
  onAssignBranch: (branch: string) => Promise<void>;
  onSyncCommits: () => Promise<void>;
  onUpdateStory: (input: UpdateStoryInput) => Promise<void>;
  onMoveToSprint: (sprintId: string | null) => Promise<void>;
  onDelete: () => Promise<void>;
}

const PRIORITY_TONES: Record<Story["priority"], BadgeTone> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
};

export function StoryDetailModal({
  story,
  project,
  sprints,
  onClose,
  onAssignBranch,
  onSyncCommits,
  onUpdateStory,
  onMoveToSprint,
  onDelete,
}: StoryDetailModalProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleSync() {
    setIsSyncing(true);
    setSyncMessage(null);

    try {
      await onSyncCommits();
      setSyncMessage("Commits synced.");
    } catch (caught) {
      setSyncMessage(
        caught instanceof ApiError
          ? caught.message
          : "Could not sync commits. Check that the branch exists on GitHub.",
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
      <div className={styles.detail}>
        <div className={styles.badges}>
          <Badge tone="accent">{story.storyPoints} pts</Badge>
          <Badge tone={PRIORITY_TONES[story.priority]}>
            {STORY_PRIORITY_LABELS[story.priority]}
          </Badge>
          <Badge>{STORY_STATUS_LABELS[story.status]}</Badge>
        </div>

        <dl className={styles.properties}>
          <div className={styles.property}>
            <dt>Project</dt>
            <dd>{project ? project.name : "Unknown project"}</dd>
          </div>
          <div className={styles.property}>
            <dt>GitHub</dt>
            <dd>
              {project
                ? `${project.githubAccount}/${project.repository}`
                : "Not linked"}
            </dd>
          </div>
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

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Branch</h3>
          <BranchForm
            key={story.branch}
            projectId={story.projectId}
            initialBranch={story.branch}
            submitLabel="Update branch"
            onSubmit={onAssignBranch}
          />
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Commits</h3>
            <Button
              variant="secondary"
              disabled={isSyncing}
              onClick={() => {
                void handleSync();
              }}
            >
              {isSyncing ? "Syncing…" : "Sync commits"}
            </Button>
          </div>
          {syncMessage ? (
            <p className={styles.syncMessage} role="status">
              {syncMessage}
            </p>
          ) : null}
          <CommitList commits={story.commits} />
        </section>

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
          <p className={styles.syncMessage} role="alert">
            {deleteError}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
