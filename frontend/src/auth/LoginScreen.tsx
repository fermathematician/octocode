import { useState, type FormEvent } from "react";
import { signInWithGithubToken } from "../api/auth";
import { getApiBaseUrl } from "../api/http";
import styles from "./LoginScreen.module.css";

const DEV_LOGIN_ENABLED = import.meta.env.VITE_DEV_LOGIN === "true";

export function LoginScreen() {
  const authFailed =
    new URLSearchParams(window.location.search).get("auth") === "error";
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  function handleLogin() {
    window.location.href = `${getApiBaseUrl()}/auth/github`;
  }

  async function handleTokenLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTokenError(null);
    setIsSubmitting(true);

    try {
      await signInWithGithubToken(token.trim());
      window.location.reload();
    } catch {
      setTokenError(
        "That token was rejected. Check that it is valid and has `repo` and `read:user` scopes.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <span className={styles.mark} aria-hidden="true">
          ◆
        </span>
        <h1 className={styles.title}>DevBoard</h1>
        <p className={styles.subtitle}>
          Sign in with GitHub to organize your projects, sprints, backlog and
          calendar.
        </p>

        {authFailed ? (
          <p className={styles.error} role="alert">
            GitHub sign-in failed. Please try again.
          </p>
        ) : null}

        <button type="button" className={styles.button} onClick={handleLogin}>
          Sign in with GitHub
        </button>

        {DEV_LOGIN_ENABLED ? (
          <form className={styles.devForm} onSubmit={handleTokenLogin}>
            <p className={styles.devNote}>
              Dev mode: paste a GitHub personal access token (scopes:{" "}
              <code>repo</code>, <code>read:user</code>).
            </p>
            <label className={styles.devLabel} htmlFor="dev-token">
              Personal access token
            </label>
            <input
              id="dev-token"
              className={styles.devInput}
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="ghp_…"
              autoComplete="off"
            />
            {tokenError ? (
              <p className={styles.error} role="alert">
                {tokenError}
              </p>
            ) : null}
            <button
              type="submit"
              className={styles.button}
              disabled={isSubmitting || token.length === 0}
            >
              {isSubmitting ? "Signing in…" : "Sign in with token"}
            </button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
