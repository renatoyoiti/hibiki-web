import { Heart } from 'lucide-react';
import type { Sound } from '../../../types';
import { useSoundStore } from '../store/soundStore';

interface SoundCardProps {
  sound: Sound;
  onAfterAdd?: () => void;
}

export default function SoundCard({ sound, onAfterAdd }: SoundCardProps) {
  const { activeSounds, addSound, toggleFavorite } = useSoundStore();

  const isActive = activeSounds.some((s) => s.id === sound.id);

  return (
    <div
      className={[
        'group relative flex flex-col gap-3 p-4 rounded-2xl border transition-all cursor-default',
        isActive
          ? 'bg-surface border-primary/50 shadow-md shadow-primary/10'
          : 'bg-surface border-border hover:border-primary/30 hover:shadow-sm',
      ].join(' ')}
    >
      {/* Botão favorito */}
      <button
        onClick={() => toggleFavorite(sound.id)}
        aria-label={sound.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-text-muted hover:text-primary transition-colors"
      >
        <Heart
          size={16}
          className={sound.isFavorite ? 'fill-primary text-primary' : ''}
        />
      </button>

      {/* Nome */}
      <p className="text-sm font-medium text-text-primary pr-8 leading-snug">{sound.name}</p>

      {/* Adicionar */}
      <button
        onClick={() => {
          if (addSound(sound)) onAfterAdd?.();
        }}
        disabled={isActive}
        aria-label={isActive ? 'Som já adicionado' : 'Adicionar ao mixer'}
        className={[
          'text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors self-start',
          isActive
            ? 'bg-primary/20 text-primary cursor-default'
            : 'bg-primary text-white hover:bg-primary-hover',
        ].join(' ')}
      >
        {isActive ? 'Ativo' : '+ Adicionar'}
      </button>
    </div>
  );
}
