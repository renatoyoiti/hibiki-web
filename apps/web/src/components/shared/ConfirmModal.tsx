import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      if (!isLoading) onCancel();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [isLoading, onCancel]);

  return (
    <dialog
      ref={dialogRef}
      className="bg-transparent p-0 max-w-none w-full h-full backdrop:bg-black/60"
      aria-labelledby={titleId}
    >
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-surface rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 id={titleId} className="text-lg font-semibold text-text-primary">
              {title}
            </h2>
            <button
              onClick={onCancel}
              disabled={isLoading}
              aria-label="Fechar"
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-text-secondary text-sm mb-6">{message}</p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-sm text-text-secondary border border-border hover:bg-surface-muted transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-sm bg-danger text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? 'Aguarde...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
