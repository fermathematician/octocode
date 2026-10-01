import { useEffect, useState } from "react";
import { getProjectBranches } from "../../../api/github";
import { ApiError } from "../../../api/http";

interface UseProjectBranchesResult {
  branches: string[];
  loading: boolean;
  error: string | null;
}

export function useProjectBranches(
  projectId: string | null,
): UseProjectBranchesResult {
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const id = projectId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await getProjectBranches(id);
        if (!cancelled) {
          setBranches(result);
        }
      } catch (caught) {
        if (!cancelled) {
          setBranches([]);
          setError(
            caught instanceof ApiError
              ? caught.message
              : "Could not load branches. Check the GitHub token permissions.",
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
  }, [projectId]);

  return { branches, loading, error };
}
