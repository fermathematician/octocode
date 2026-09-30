import styles from "./Spinner.module.css";

interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = "Loading…" }: SpinnerProps) {
  return (
    <div className={styles.wrapper} role="status">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
