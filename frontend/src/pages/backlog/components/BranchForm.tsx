import { useState, type FormEvent } from "react";
import { Button } from "../../../components/shared/Button/Button";
import { useProjectBranches } from "../hooks/useProjectBranches";
import { validateBranchName } from "../validation/story-form.schema";
import { BranchPicker } from "./BranchPicker";
import styles from "./BranchForm.module.css";

interface BranchFormProps {
  projectId: string;
  initialBranch: string;
  submitLabel: string;
  onSubmit: (branch: string) => Promise<void>;
}

export function BranchForm({
  projectId,
  initialBranch,
  submitLabel,
  onSubmit,
}: BranchFormProps) {
  const [branch, setBranch] = useState(initialBranch);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { branches, error: branchesError } = useProjectBranches(projectId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateBranchName(branch);

    if (validationError) {
      setFieldError(validationError);
      return;
    }

    setFieldError(null);
    setFormError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(branch.trim());
    } catch {
      setFormError("Unable to save the branch. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <BranchPicker
        id="story-branch"
        label="GitHub branch"
        value={branch}
        onChange={setBranch}
        branches={branches}
        hint={branchesError ?? undefined}
        placeholder="feat/story-name"
        error={fieldError ?? undefined}
      />
      {formError ? (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      ) : null}
      <div className={styles.actions}>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
