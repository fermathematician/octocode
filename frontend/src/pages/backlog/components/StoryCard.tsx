import { Badge, type BadgeTone } from "../../../components/shared/Badge/Badge";
import {
  STORY_PRIORITY_LABELS,
  STORY_STATUS_LABELS,
} from "../../../domain/story";
import type { Story } from "../../../domain/types";
import styles from "./StoryCard.module.css";

interface StoryCardProps {
  story: Story;
  projectName?: string;
  onSelect: (story: Story) => void;
}

const PRIORITY_TONES: Record<Story["priority"], BadgeTone> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
};

export function StoryCard({ story, projectName, onSelect }: StoryCardProps) {
  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => onSelect(story)}
    >
      <span className={styles.title}>{story.title}</span>
      <span className={styles.meta}>
        {projectName ? (
          <span className={styles.project}>{projectName}</span>
        ) : null}
        <Badge tone="accent">{story.storyPoints} pts</Badge>
        <Badge tone={PRIORITY_TONES[story.priority]}>
          {STORY_PRIORITY_LABELS[story.priority]}
        </Badge>
        <span className={styles.status}>
          {STORY_STATUS_LABELS[story.status]}
        </span>
      </span>
      <span className={styles.branch} title={story.branch}>
        {story.branch}
      </span>
    </button>
  );
}
