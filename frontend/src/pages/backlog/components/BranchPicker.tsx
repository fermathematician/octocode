import { useMemo, useState } from "react";
import styles from "./BranchPicker.module.css";

interface BranchOption {
  name: string;
  source: "github" | "local";
}

interface BranchPickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  branches: BranchOption[];
  error?: string;
  hint?: string;
  placeholder?: string;
}

const MAX_OPTIONS = 100;

export function BranchPicker({
  id,
  label,
  value,
  onChange,
  branches,
  error,
  hint,
  placeholder,
}: BranchPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const options = useMemo(() => {
    const term = value.trim().toLowerCase();
    const isKnownBranch = branches.some(
      (branch) => branch.name.toLowerCase() === term,
    );

    const filtered =
      !term || isKnownBranch
        ? branches
        : branches.filter((branch) =>
            branch.name.toLowerCase().includes(term),
          );

    // Never hide every branch: fall back to the full list when nothing matches.
    const results = filtered.length > 0 ? filtered : branches;

    return results.slice(0, MAX_OPTIONS);
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
              <li key={branch.name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={branch.name === value}
                  className={styles.option}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(branch.name);
                    setIsOpen(false);
                  }}
                >
                  <span className={styles.optionName}>{branch.name}</span>
                  {branch.source === "local" ? (
                    <span className={styles.localTag} title="Only in your local clone">
                      local
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {branches.length === 0 ? (
        <p className={styles.hint}>
          {hint ?? "No branches loaded — type a branch name."}
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
