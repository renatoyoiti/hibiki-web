import { useState, useEffect } from 'react';
import type { ActiveSound } from '../../../types';

interface PresetFormProps {
  isOpen: boolean;
  mode: 'create' | 'rename';
  initialName?: string;
  activeSounds?: ActiveSound[];
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export default function PresetForm({
  isOpen,
  mode,
  initialName = '',
  activeSounds = [],
  onConfirm,
  onCancel,
}: PresetFormProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (isOpen) setName(initialName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const title = mode === 'create' ? 'Salvar preset' : 'Renomear preset';
  const confirmLabel = mode === 'create' ? 'Salvar' : 'Renomear';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm(name.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-elevated border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-text-primary mb-4">{title}</h2>

        <label className="block text-sm text-text-secondary mb-1">Nome do preset</label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Foco profundo"
          className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
        />

        {mode === 'create' && activeSounds.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-text-muted uppercase tracking-widest mb-2">Sons incluídos</p>
            <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto">
              {activeSounds.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between text-sm text-text-secondary bg-surface rounded-lg px-3 py-1.5"
                >
                  <span className="truncate">{s.name}</span>
                  <span className="text-xs text-text-muted ml-2 shrink-0">Vol {s.volume}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {mode === 'create' && activeSounds.length === 0 && (
          <p className="text-sm text-text-muted mb-4 italic">
            Nenhum som ativo — preset será salvo vazio.
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-text-secondary border border-border hover:bg-surface-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
