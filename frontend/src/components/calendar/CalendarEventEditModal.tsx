import type {
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from "../../api/calendar-events";
import type { CalendarEvent } from "../../domain/types";
import { Modal } from "../shared/Modal/Modal";
import { CalendarEventForm } from "./CalendarEventForm";

interface CalendarEventEditModalProps {
  event: CalendarEvent;
  onSave: (
    eventId: string,
    input: UpdateCalendarEventInput,
  ) => Promise<void>;
  onClose: () => void;
}

export function CalendarEventEditModal({
  event,
  onSave,
  onClose,
}: CalendarEventEditModalProps) {
  async function handleSubmit(input: CreateCalendarEventInput) {
    await onSave(event.id, input);
  }

  return (
    <Modal title="Edit task" onClose={onClose}>
      <CalendarEventForm
        key={event.id}
        defaultDate={event.date}
        initialEvent={event}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
