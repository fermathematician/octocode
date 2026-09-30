import { useEffect, useState } from "react";
import { getProjectBranches } from "../../../api/github";

interface UseProjectBranchesResult {
  branches: string[];
  loading: boolean;
}

export function useProjectBranches(
  projectId: string | null,
): UseProjectBranchesResult {
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const id = projectId;
    let cancelled = false;

    async function load() {
      setLoading(true);

      try {
        const result = await getProjectBranches(id);
        if (!cancelled) {
          setBranches(result);
        }
      } catch {
        // No linked repository, no GitHub token, or offline: fall back to free text.
        if (!cancelled) {
          setBranches([]);
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

  return { branches, loading };
}
