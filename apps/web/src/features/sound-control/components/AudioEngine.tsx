import { useEffect, useRef } from 'react';
import { useSoundStore } from '../store/soundStore';

/**
 * Componente sem UI — gerencia instâncias de <audio loop> sincronizadas
 * com a fila ativa do store. Cada ActiveSound tem sua instância de Audio
 * criada, atualizada (volume/mute) e destruída aqui.
 */
export default function AudioEngine() {
  const audioInstances = useRef<Record<string, HTMLAudioElement>>({});
  const { activeSounds, isGlobalMuted } = useSoundStore();
  const isGlobalPaused = useSoundStore((s) => s.isGlobalPaused);
  const isGlobalPausedRef = useRef(isGlobalPaused);

  // Keep ref in sync with isGlobalPaused
  useEffect(() => {
    isGlobalPausedRef.current = isGlobalPaused;
  }, [isGlobalPaused]);

  // Criar/destruir instâncias conforme a fila muda
  useEffect(() => {
    const currentIds = new Set(activeSounds.map((s) => s.id));
    const existingIds = new Set(Object.keys(audioInstances.current));

    // Adicionar novas instâncias
    for (const sound of activeSounds) {
      if (!existingIds.has(sound.id)) {
        const audio = new Audio(sound.filePath);
        audio.loop = true;
        if (!isGlobalPausedRef.current) {
          audio.play().catch(() => {
            // Autoplay bloqueado — usuário precisa interagir com a página primeiro
          });
        }
        audioInstances.current[sound.id] = audio;
      }
    }

    // Remover instâncias de sons retirados da fila
    for (const id of existingIds) {
      if (!currentIds.has(id)) {
        const audio = audioInstances.current[id];
        audio.pause();
        audio.src = '';
        delete audioInstances.current[id];
      }
    }
  }, [activeSounds]);

  // Sincronizar volume e mute em cada mudança de estado
  useEffect(() => {
    for (const sound of activeSounds) {
      const audio = audioInstances.current[sound.id];
      if (!audio) continue;

      const effectivelyMuted = sound.isMuted || isGlobalMuted;
      audio.volume = effectivelyMuted ? 0 : sound.volume / 100;
    }
  }, [activeSounds, isGlobalMuted]);

  // Pause/resume all audio elements when global pause state changes
  useEffect(() => {
    const entries = Object.values(audioInstances.current);
    if (isGlobalPaused) {
      entries.forEach((audio) => audio.pause());
    } else {
      entries.forEach((audio) => audio.play().catch(console.error));
    }
  }, [isGlobalPaused]);

  // Limpar todas as instâncias ao desmontar
  useEffect(() => {
    return () => {
      for (const audio of Object.values(audioInstances.current)) {
        audio.pause();
        audio.src = '';
      }
      audioInstances.current = {};
    };
  }, []);

  return null;
}
