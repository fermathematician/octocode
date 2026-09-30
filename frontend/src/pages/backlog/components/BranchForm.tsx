import { useState, type FormEvent } from "react";
import { Button } from "../../../components/shared/Button/Button";
import { TextInput } from "../../../components/shared/TextInput/TextInput";
import { validateBranchName } from "../validation/story-form.schema";
import styles from "./BranchForm.module.css";

interface BranchFormProps {
  initialBranch: string;
  submitLabel: string;
  onSubmit: (branch: string) => Promise<void>;
}

export function BranchForm({
  initialBranch,
  submitLabel,
  onSubmit,
}: BranchFormProps) {
  const [branch, setBranch] = useState(initialBranch);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      <TextInput
        id="story-branch"
        label="GitHub branch"
        value={branch}
        onChange={setBranch}
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
