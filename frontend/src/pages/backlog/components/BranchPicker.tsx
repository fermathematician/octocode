import { useMemo, useState } from "react";
import styles from "./BranchPicker.module.css";

interface BranchPickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  branches: string[];
  error?: string;
  placeholder?: string;
}

const MAX_OPTIONS = 8;

export function BranchPicker({
  id,
  label,
  value,
  onChange,
  branches,
  error,
  placeholder,
}: BranchPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const options = useMemo(() => {
    const term = value.trim().toLowerCase();
    const matches = term
      ? branches.filter((branch) => branch.toLowerCase().includes(term))
      : branches;

    return matches.slice(0, MAX_OPTIONS);
  }, [branches, value]);

  const optionsId = `${id}-options`;
  const errorId = `${id}-error`;
  const isExpanded = isOpen && options.length > 0;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.combo}>
        <input
          id={id}
          className={styles.input}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={isExpanded}
          aria-controls={optionsId}
          aria-autocomplete="list"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {isExpanded ? (
          <ul className={styles.options} id={optionsId} role="listbox">
            {options.map((branch) => (
              <li key={branch}>
                <button
                  type="button"
                  role="option"
                  aria-selected={branch === value}
                  className={styles.option}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(branch);
                    setIsOpen(false);
                  }}
                >
                  {branch}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {error ? (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
