import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api/http";
import type { CurrentUser } from "../domain/types";

interface UseCurrentUserResult {
  user: CurrentUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const current = await apiFetch<CurrentUser>("/auth/me");
        if (!cancelled) {
          setUser(current);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
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

  const logout = useCallback(async () => {
    try {
      await apiFetch<void>("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  return { user, loading, logout };
}
