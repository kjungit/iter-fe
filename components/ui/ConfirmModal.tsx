import { Button } from "@/components/ui/Button";

interface ConfirmModalProps {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-backdrop"
      onClick={onCancel}
    >
      {/* stopPropagation is required here — without it, clicks on the card bubble to the
          backdrop and close the modal immediately (bug hit in the design prototype). */}
      <div
        className="w-[340px] rounded-xl bg-white p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="mb-5 text-center text-[15px] leading-[1.5] font-bold text-ink">{message}</p>
        <div className="flex gap-2.5">
          <Button variant="secondary" size="sm" className="flex-1 rounded-sm py-3 text-[13.5px]" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="primary" size="sm" className="flex-1 rounded-sm py-3 text-[13.5px]" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
