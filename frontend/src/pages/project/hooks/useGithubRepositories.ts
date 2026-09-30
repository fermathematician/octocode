import { useEffect, useState } from "react";
import {
  getGithubRepositories,
  type GithubRepositorySummary,
} from "../../../api/github";
import { ApiError } from "../../../api/http";

interface UseGithubRepositoriesResult {
  repositories: GithubRepositorySummary[];
  loading: boolean;
  error: string | null;
}

export function useGithubRepositories(): UseGithubRepositoriesResult {
  const [repositories, setRepositories] = useState<GithubRepositorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await getGithubRepositories();
        if (!cancelled) {
          setRepositories(result);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : "Unable to load your GitHub repositories.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { repositories, loading, error };
}
