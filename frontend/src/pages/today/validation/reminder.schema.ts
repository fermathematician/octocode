export interface ReminderFormValues {
  title: string;
  startTime: string;
}

export interface ReminderFormErrors {
  title?: string;
  startTime?: string;
}

export function validateReminder(
  values: ReminderFormValues,
): ReminderFormErrors {
  const errors: ReminderFormErrors = {};

  if (!values.title.trim()) {
    errors.title = "Reminder title is required.";
  }

  if (!values.startTime) {
    errors.startTime = "Pick a time.";
  }

  return errors;
}
