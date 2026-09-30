import { useMemo, useState, type FormEvent } from "react";
import { getApiBaseUrl, ApiError } from "../../../api/http";
import { createProjectFromRepository } from "../../../api/projects";
import type { GithubRepositorySummary } from "../../../api/github";
import { Button } from "../../../components/shared/Button/Button";
import { ErrorState } from "../../../components/shared/ErrorState/ErrorState";
import { Modal } from "../../../components/shared/Modal/Modal";
import { Spinner } from "../../../components/shared/Spinner/Spinner";
import type { Project } from "../../../domain/types";
import { useGithubRepositories } from "../hooks/useGithubRepositories";
import styles from "./AddProjectModal.module.css";

interface AddProjectModalProps {
  onClose: () => void;
  onCreated: (project: Project) => void;
}

export function AddProjectModal({ onClose, onCreated }: AddProjectModalProps) {
  const { repositories, loading, error } = useGithubRepositories();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<GithubRepositorySummary | null>(null);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return repositories;
    }

    return repositories.filter((repository) =>
      `${repository.owner}/${repository.name}`.toLowerCase().includes(term),
    );
  }, [repositories, search]);

  function selectRepository(repository: GithubRepositorySummary) {
    setSelected(repository);
    setName((current) => (current.trim() ? current : repository.name));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selected) {
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const project = await createProjectFromRepository({
        name: name.trim() || selected.name,
        repoId: selected.repoId,
        owner: selected.owner,
        repositoryName: selected.name,
        defaultBranch: selected.defaultBranch,
        isPrivate: selected.isPrivate,
      });
      onCreated(project);
    } catch (caught) {
      setFormError(
        caught instanceof ApiError
          ? caught.message
          : "Unable to create the project.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Add project" onClose={onClose}>
      {loading ? <Spinner label="Loading your repositories…" /> : null}

      {!loading && error ? (
        <ErrorState
          message={`${error} Check that you signed in with GitHub and that ${getApiBaseUrl()} is reachable.`}
        />
      ) : null}

      {!loading && !error ? (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="repo-search">
              Repository
            </label>
            <input
              id="repo-search"
              className={styles.input}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search repositories…"
              autoComplete="off"
            />
          </div>

          <ul className={styles.list}>
            {filtered.map((repository) => (
              <li key={repository.repoId}>
                <button
                  type="button"
                  className={`${styles.repo} ${
                    selected?.repoId === repository.repoId
                      ? styles.repoSelected
                      : ""
                  }`}
                  onClick={() => selectRepository(repository)}
                  aria-pressed={selected?.repoId === repository.repoId}
                >
                  <span className={styles.repoName}>
                    {repository.owner}/{repository.name}
                  </span>
                  {repository.isPrivate ? (
                    <span className={styles.tag}>private</span>
                  ) : null}
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className={styles.empty}>No repositories match your search.</li>
            ) : null}
          </ul>

          {selected ? (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="project-name">
                Project name
              </label>
              <input
                id="project-name"
                className={styles.input}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={selected.name}
              />
            </div>
          ) : null}

          {formError ? (
            <p className={styles.error} role="alert">
              {formError}
            </p>
          ) : null}

          <div className={styles.actions}>
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selected}>
              {isSubmitting ? "Creating…" : "Create project"}
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
