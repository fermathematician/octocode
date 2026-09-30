import type { DragEvent } from "react";
import { Badge, type BadgeTone } from "../../../components/shared/Badge/Badge";
import { STORY_PRIORITY_LABELS } from "../../../domain/story";
import type { Story } from "../../../domain/types";
import styles from "./KanbanCard.module.css";

interface KanbanCardProps {
  story: Story;
  projectName?: string;
  canMoveBackward: boolean;
  canMoveForward: boolean;
  onMoveBackward: () => void;
  onMoveForward: () => void;
}

const PRIORITY_TONES: Record<Story["priority"], BadgeTone> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
};

export function KanbanCard({
  story,
  projectName,
  canMoveBackward,
  canMoveForward,
  onMoveBackward,
  onMoveForward,
}: KanbanCardProps) {
  function handleDragStart(event: DragEvent<HTMLElement>) {
    event.dataTransfer.setData("text/plain", story.id);
    event.dataTransfer.effectAllowed = "move";
  }

  return (
    <article
      className={styles.card}
      draggable
      onDragStart={handleDragStart}
    >
      {projectName ? (
        <span className={styles.project}>{projectName}</span>
      ) : null}
      <h3 className={styles.title}>{story.title}</h3>
      <span className={styles.branch} title={story.branch}>
        {story.branch}
      </span>
      <div className={styles.meta}>
        <Badge tone="accent">{story.storyPoints} pts</Badge>
        <Badge tone={PRIORITY_TONES[story.priority]}>
          {STORY_PRIORITY_LABELS[story.priority]}
        </Badge>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.move}
          onClick={onMoveBackward}
          disabled={!canMoveBackward}
          aria-label={`Move ${story.title} backward`}
        >
          ←
        </button>
        <button
          type="button"
          className={styles.move}
          onClick={onMoveForward}
          disabled={!canMoveForward}
          aria-label={`Move ${story.title} forward`}
        >
          →
        </button>
      </div>
    </article>
  );
}
