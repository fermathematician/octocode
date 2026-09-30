import type { ReactNode } from "react";
import styles from "./Badge.module.css";

export type BadgeTone =
  | "neutral"
  | "accent"
  | "critical"
  | "high"
  | "medium"
  | "low";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
}

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
