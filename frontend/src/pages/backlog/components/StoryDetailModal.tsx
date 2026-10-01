import { Badge, type BadgeTone } from "../../../components/shared/Badge/Badge";
import { Modal } from "../../../components/shared/Modal/Modal";
import {
  STORY_PRIORITY_LABELS,
  STORY_STATUS_LABELS,
} from "../../../domain/story";
import type { Project, Story } from "../../../domain/types";
import { BranchForm } from "./BranchForm";
import { CommitList } from "../../../components/stories/CommitList";
import styles from "./StoryDetailModal.module.css";

interface StoryDetailModalProps {
  story: Story;
  project: Project | undefined;
  onClose: () => void;
  onAssignBranch: (branch: string) => Promise<void>;
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
  onClose,
  onAssignBranch,
}: StoryDetailModalProps) {
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
          <h3 className={styles.sectionTitle}>Commits</h3>
          <CommitList commits={story.commits} />
        </section>
      </div>
    </Modal>
  );
}
