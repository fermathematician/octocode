import type { StoryStatus } from "../../../domain/types";
import type { KanbanColumnData } from "../hooks/useSprint";
import { KanbanColumn } from "./KanbanColumn";
import styles from "./KanbanBoard.module.css";

interface KanbanBoardProps {
  columns: KanbanColumnData[];
  projectNames: Record<string, string>;
  onMove: (storyId: string, status: StoryStatus) => void;
}

export function KanbanBoard({
  columns,
  projectNames,
  onMove,
}: KanbanBoardProps) {
  return (
    <div className={styles.board}>
      {columns.map((column) => (
        <KanbanColumn
          key={column.status}
          status={column.status}
          stories={column.stories}
          projectNames={projectNames}
          onMove={onMove}
        />
      ))}
    </div>
  );
}
