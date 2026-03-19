import { Volume2, VolumeX, X } from 'lucide-react';
import type { ActiveSound } from '../../../types';
import { useSoundStore } from '../store/soundStore';
import VolumeSlider from './VolumeSlider';

interface ActiveSoundItemProps {
  sound: ActiveSound;
}

export default function ActiveSoundItem({ sound }: ActiveSoundItemProps) {
  const { setVolume, toggleMute, removeSound, isGlobalMuted } = useSoundStore();

  const effectivelyMuted = sound.isMuted || isGlobalMuted;
  const sliderValue = effectivelyMuted ? 0 : sound.volume;

  function handleSliderChange(value: number) {
    setVolume(sound.id, value);
  }

  return (
    <div className="flex items-center gap-3 bg-surface rounded-xl px-4 py-3 shadow-sm">
      <span className="text-sm font-medium text-text-primary flex-1 truncate">{sound.name}</span>

      <VolumeSlider
        value={sliderValue}
        onChange={handleSliderChange}
        disabled={isGlobalMuted}
        className="w-28"
      />

      <span className="text-xs text-text-muted w-8 text-right tabular-nums">
        {effectivelyMuted ? '—' : `${sound.volume}`}
      </span>

      <button
        onClick={() => toggleMute(sound.id)}
        disabled={isGlobalMuted}
        aria-label={sound.isMuted ? 'Desmutar' : 'Mutar'}
        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {effectivelyMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      <button
        onClick={() => removeSound(sound.id)}
        aria-label="Remover"
        className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
