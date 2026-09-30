import type { Story } from "../../../domain/types";
import { StoryCard } from "./StoryCard";
import styles from "./StoryList.module.css";

interface StoryListProps {
  stories: Story[];
  projectNames: Record<string, string>;
  onSelect: (story: Story) => void;
}

export function StoryList({ stories, projectNames, onSelect }: StoryListProps) {
  return (
    <ul className={styles.list}>
      {stories.map((story) => (
        <li key={story.id}>
          <StoryCard
            story={story}
            projectName={projectNames[story.projectId]}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
