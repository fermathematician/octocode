import { STORY_STATUS_LABELS } from "../../../domain/story";
import { STORY_STATUSES, type Story, type StoryStatus } from "../../../domain/types";
import { KanbanCard } from "./KanbanCard";
import styles from "./KanbanColumn.module.css";

interface KanbanColumnProps {
  status: StoryStatus;
  stories: Story[];
  projectNames: Record<string, string>;
  onMove: (storyId: string, status: StoryStatus) => void;
}

export function KanbanColumn({
  status,
  stories,
  projectNames,
  onMove,
}: KanbanColumnProps) {
  const statusIndex = STORY_STATUSES.indexOf(status);
  const previousStatus = STORY_STATUSES[statusIndex - 1];
  const nextStatus = STORY_STATUSES[statusIndex + 1];

  return (
    <section className={styles.column} aria-label={STORY_STATUS_LABELS[status]}>
      <header className={styles.header}>
        <h2 className={styles.title}>{STORY_STATUS_LABELS[status]}</h2>
        <span className={styles.count}>{stories.length}</span>
      </header>
      <div className={styles.cards}>
        {stories.map((story) => (
          <KanbanCard
            key={story.id}
            story={story}
            projectName={projectNames[story.projectId]}
            canMoveBackward={previousStatus !== undefined}
            canMoveForward={nextStatus !== undefined}
            onMoveBackward={() => {
              if (previousStatus) {
                onMove(story.id, previousStatus);
              }
            }}
            onMoveForward={() => {
              if (nextStatus) {
                onMove(story.id, nextStatus);
              }
            }}
          />
        ))}
      </div>
    </section>
  );
}
