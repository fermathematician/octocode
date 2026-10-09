import type { Sprint } from "../../domain/types";
import { Modal } from "../shared/Modal/Modal";
import { SprintForm, type SprintFormValues } from "./SprintForm";

interface EditSprintModalProps {
  sprint: Sprint;
  onSave: (sprintId: string, values: SprintFormValues) => Promise<void>;
  onClose: () => void;
}

export function EditSprintModal({
  sprint,
  onSave,
  onClose,
}: EditSprintModalProps) {
  return (
    <Modal title="Edit sprint" onClose={onClose}>
      <SprintForm
        key={sprint.id}
        initialSprint={sprint}
        submitLabel="Save changes"
        onSubmit={(values) => onSave(sprint.id, values)}
        onCancel={onClose}
      />
    </Modal>
  );
}
