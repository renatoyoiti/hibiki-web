import { Play, Pencil, Trash2 } from 'lucide-react';
import type { Preset } from '../../../types';

interface PresetCardProps {
  preset: Preset;
  isActive: boolean;
  onLoad: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function soundSummary(sounds: Preset['sounds']): string {
  if (sounds.length === 0) return 'Nenhum som';
  const names = sounds.slice(0, 3).map((s) => s.name);
  const more = sounds.length - 3;
  return more > 0 ? `${names.join(', ')} e mais ${more}` : names.join(', ');
}

export default function PresetCard({
  preset,
  isActive,
  onLoad,
  onRename,
  onDelete,
}: PresetCardProps) {
  return (
    <div
      className={[
        'flex flex-col gap-3 p-4 rounded-2xl border transition-all',
        isActive
          ? 'bg-surface border-primary shadow-md shadow-primary/10'
          : 'bg-surface border-border hover:border-primary/30',
      ].join(' ')}
    >
      {/* Header: nome + botões de ação */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-text-primary truncate flex-1">{preset.name}</h3>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onRename}
            aria-label="Renomear preset"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            disabled={isActive}
            aria-label={isActive ? 'Pare a execução para excluir' : 'Excluir preset'}
            title={isActive ? 'Pare a execução para poder excluir este preset' : undefined}
            className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-text-muted disabled:hover:bg-transparent"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Resumo dos sons */}
      <p className="text-xs text-text-muted truncate">{soundSummary(preset.sounds)}</p>

      {/* Botão Carregar */}
      <button
        onClick={onLoad}
        disabled={isActive}
        className={[
          'flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors self-start',
          isActive
            ? 'bg-primary/20 text-primary cursor-default'
            : 'bg-primary text-white hover:bg-primary-hover',
        ].join(' ')}
      >
        <Play size={12} />
        {isActive ? 'Em execução' : 'Carregar'}
      </button>
    </div>
  );
}
