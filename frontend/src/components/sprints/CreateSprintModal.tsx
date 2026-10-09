import { createSprint } from "../../api/sprints";
import { Modal } from "../shared/Modal/Modal";
import { SprintForm, type SprintFormValues } from "./SprintForm";

interface CreateSprintModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateSprintModal({
  onClose,
  onCreated,
}: CreateSprintModalProps) {
  async function handleSubmit(values: SprintFormValues) {
    await createSprint(values);
    onCreated();
  }

  return (
    <Modal title="Generate sprint" onClose={onClose}>
      <SprintForm
        submitLabel="Generate sprint"
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
