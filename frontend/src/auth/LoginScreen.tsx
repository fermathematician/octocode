import { getApiBaseUrl } from "../api/http";
import styles from "./LoginScreen.module.css";

export function LoginScreen() {
  const authFailed =
    new URLSearchParams(window.location.search).get("auth") === "error";

  function handleLogin() {
    window.location.href = `${getApiBaseUrl()}/auth/github`;
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
      </div>
    </main>
  );
}
