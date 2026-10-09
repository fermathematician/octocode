import { useState } from "react";
import { Button } from "../../components/shared/Button/Button";
import { EmptyState } from "../../components/shared/EmptyState/EmptyState";
import { ErrorState } from "../../components/shared/ErrorState/ErrorState";
import { Spinner } from "../../components/shared/Spinner/Spinner";
import { CreateSprintModal } from "../../components/sprints/CreateSprintModal";
import { EditSprintModal } from "../../components/sprints/EditSprintModal";
import type { Sprint } from "../../domain/types";
import { useSprints } from "./hooks/useSprints";
import { SprintCard } from "./components/SprintCard";
import styles from "./index.module.css";

export function SprintsPage() {
  const { entries, loading, error, deleteSprint, editSprint, reload } =
    useSprints();
  const [isCreating, setIsCreating] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);

  function handleDelete(sprintId: string, name: string) {
    const confirmed = window.confirm(
      `Delete "${name}"? Its stories stay, but are unassigned from the sprint.`,
    );

    if (confirmed) {
      void deleteSprint(sprintId);
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Sprints</h1>
          <p className={styles.subtitle}>
            One timeline across every project, with progress.
          </p>
        </div>
        <div className={styles.controls}>
          <Button onClick={() => setIsCreating(true)}>Generate sprint</Button>
        </div>
      </header>

      {loading ? <Spinner label="Loading sprints…" /> : null}

      {!loading && error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : null}

      {!loading && !error && entries.length === 0 ? (
        <EmptyState
          title="No sprints yet"
          description="Use Generate sprint to create a sprint and pick its date range."
        />
      ) : null}

      {!loading && !error && entries.length > 0 ? (
        <ul className={styles.list}>
          {entries.map((entry) => (
            <li key={entry.sprint.id}>
              <SprintCard
                entry={entry}
                onEdit={() => setEditingSprint(entry.sprint)}
                onDelete={() => handleDelete(entry.sprint.id, entry.sprint.name)}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {isCreating ? (
        <CreateSprintModal
          onClose={() => setIsCreating(false)}
          onCreated={() => {
            setIsCreating(false);
            reload();
          }}
        />
      ) : null}

      {editingSprint ? (
        <EditSprintModal
          sprint={editingSprint}
          onSave={async (sprintId, values) => {
            await editSprint(sprintId, values);
            setEditingSprint(null);
          }}
          onClose={() => setEditingSprint(null)}
        />
      ) : null}
    </section>
  );
}
