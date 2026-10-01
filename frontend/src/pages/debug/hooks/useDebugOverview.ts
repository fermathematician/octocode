import { useCallback, useEffect, useState } from "react";
import { getDebugOverview, type DebugOverview } from "../../../api/debug";
import { ApiError } from "../../../api/http";

interface UseDebugOverviewResult {
  overview: DebugOverview | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useDebugOverview(): UseDebugOverviewResult {
  const [overview, setOverview] = useState<DebugOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await getDebugOverview();
        if (!cancelled) {
          setOverview(result);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : "Unable to load the debug overview.",
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
  }, [reloadToken]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return { overview, loading, error, reload };
}
