import { Volume2, VolumeX } from 'lucide-react';
import { useSoundStore } from '../../features/sound-control/store/soundStore';
import ActiveSoundItem from '../../features/sound-control/components/ActiveSoundItem';

export default function PlayerBar() {
  const { activeSounds, isGlobalMuted, toggleGlobalMute } = useSoundStore();

  if (activeSounds.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-base/95 backdrop-blur border-t border-border">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Cabeçalho da barra */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Mixer — {activeSounds.length} {activeSounds.length === 1 ? 'som' : 'sons'}
          </span>

          <button
            onClick={toggleGlobalMute}
            aria-label={isGlobalMuted ? 'Reativar todos' : 'Mutar todos'}
            className={[
              'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
              isGlobalMuted
                ? 'bg-warning/20 text-warning hover:bg-warning/30'
                : 'bg-surface text-text-muted hover:bg-surface-muted hover:text-text-primary',
            ].join(' ')}
          >
            {isGlobalMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {isGlobalMuted ? 'Reativar todos' : 'Mutar todos'}
          </button>
        </div>

        {/* Lista de sons ativos */}
        <div className="flex flex-col gap-2">
          {activeSounds.map((sound) => (
            <ActiveSoundItem key={sound.id} sound={sound} />
          ))}
        </div>
      </div>
    </div>
  );
}
