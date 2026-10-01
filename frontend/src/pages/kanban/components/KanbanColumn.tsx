import { useState, type DragEvent } from "react";
import { STORY_STATUS_LABELS } from "../../../domain/story";
import type { Story, StoryStatus } from "../../../domain/types";
import { KanbanCard } from "./KanbanCard";
import styles from "./KanbanColumn.module.css";

interface KanbanColumnProps {
  status: StoryStatus;
  stories: Story[];
  projectNames: Record<string, string>;
  onMove: (storyId: string, status: StoryStatus) => void;
  onSelect: (story: Story) => void;
}

export function KanbanColumn({
  status,
  stories,
  projectNames,
  onMove,
  onSelect,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDragOver(false);

    const storyId = event.dataTransfer.getData("text/plain");

    if (storyId) {
      onMove(storyId, status);
    }
  }

  return (
    <section
      className={`${styles.column} ${isDragOver ? styles.columnOver : ""}`}
      aria-label={STORY_STATUS_LABELS[status]}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
            onSelect={() => onSelect(story)}
          />
        ))}
      </div>
    </section>
  );
}
