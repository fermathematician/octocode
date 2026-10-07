import styles from "./Checkbox.module.css";

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

export function Checkbox({
  id,
  checked,
  onChange,
  label,
  ariaLabel,
  disabled = false,
}: CheckboxProps) {
  return (
    <label className={styles.field} htmlFor={id}>
      <input
        id={id}
        className={styles.input}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={label ? undefined : ariaLabel}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label ? <span className={styles.label}>{label}</span> : null}
    </label>
  );
}
