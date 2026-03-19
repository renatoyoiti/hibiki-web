import { create } from 'zustand';
import type { Sound, ActiveSound } from '../../../types';
import { soundService } from '../../../services/soundService';

interface SoundState {
  // Biblioteca
  sounds: Sound[];
  isLoadingSounds: boolean;

  // Fila de execução ativa
  activeSounds: ActiveSound[];
  isGlobalMuted: boolean;
  isGlobalPaused: boolean;
  globalPreMuteVolumes: Record<string, number>;

  // Ações — biblioteca
  fetchSounds: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;

  // Ações — fila ativa
  addSound: (sound: Sound) => boolean;
  removeSound: (id: string) => void;
  setVolume: (id: string, volume: number) => void;
  toggleMute: (id: string) => void;
  toggleGlobalMute: () => void;
  toggleGlobalPause: () => void;
  resumeAll: () => void;
  clearActiveSounds: () => void;

  // Carregar conjunto de sons (usado ao carregar preset — Fase 4)
  loadActiveSounds: (sounds: Array<{ sound: Sound; volume: number }>) => void;
}

export const useSoundStore = create<SoundState>((set, get) => ({
  sounds: [],
  isLoadingSounds: false,
  activeSounds: [],
  isGlobalMuted: false,
  isGlobalPaused: false,
  globalPreMuteVolumes: {},

  // --- Biblioteca ---

  fetchSounds: async () => {
    set({ isLoadingSounds: true });
    try {
      const sounds = await soundService.list();
      set({ sounds, isLoadingSounds: false });
    } catch {
      set({ isLoadingSounds: false });
    }
  },

  toggleFavorite: async (id) => {
    const updated = await soundService.toggleFavorite(id);
    set((state) => ({
      sounds: state.sounds.map((s) => (s.id === id ? updated : s)),
    }));
  },

  // --- Fila ativa ---

  // RN-01: bloqueia duplicatas; retorna false se já existe
  addSound: (sound) => {
    if (get().activeSounds.some((s) => s.id === sound.id)) return false;
    set((state) => ({
      activeSounds: [
        ...state.activeSounds,
        {
          id: sound.id,
          name: sound.name,
          filePath: sound.filePath,
          volume: 50, // RN-02: padrão 50
          isMuted: false,
          previousVolume: null,
        },
      ],
    }));
    return true;
  },

  removeSound: (id) => {
    set((state) => ({
      activeSounds: state.activeSounds.filter((s) => s.id !== id),
      globalPreMuteVolumes: Object.fromEntries(
        Object.entries(state.globalPreMuteVolumes).filter(([k]) => k !== id),
      ),
    }));
  },

  // RN-03: slider → 0 = mute automático; volume > 0 = desmuta
  setVolume: (id, volume) => {
    set((state) => ({
      activeSounds: state.activeSounds.map((s) => {
        if (s.id !== id) return s;
        if (volume === 0) return { ...s, volume: 0, isMuted: true, previousVolume: null };
        return { ...s, volume, isMuted: false };
      }),
    }));
  },

  // RN-03: toggle mute via botão — salva/restaura previousVolume
  toggleMute: (id) => {
    set((state) => ({
      activeSounds: state.activeSounds.map((s) => {
        if (s.id !== id) return s;
        if (s.isMuted) {
          // desmutar: restaurar volume anterior ou 50 se veio de volume=0
          const restored = s.previousVolume ?? 50;
          return { ...s, isMuted: false, volume: restored, previousVolume: null };
        }
        // mutar: salvar volume atual
        return { ...s, isMuted: true, previousVolume: s.volume };
      }),
    }));
  },

  // RN-04: mute global com preservação de volumes individuais
  toggleGlobalMute: () => {
    const { isGlobalMuted, activeSounds, globalPreMuteVolumes } = get();

    if (!isGlobalMuted) {
      // Salvar volume de cada som não individualmente mutado
      const volumes: Record<string, number> = {};
      activeSounds.forEach((s) => {
        if (!s.isMuted) volumes[s.id] = s.volume;
      });
      set({ isGlobalMuted: true, globalPreMuteVolumes: volumes });
    } else {
      // Restaurar volumes salvos
      set((state) => ({
        isGlobalMuted: false,
        activeSounds: state.activeSounds.map((s) => ({
          ...s,
          volume: globalPreMuteVolumes[s.id] ?? s.volume,
        })),
        globalPreMuteVolumes: {},
      }));
    }
  },

  // Toggle pausar/retomar todos os sons
  toggleGlobalPause: () => set((s) => ({ isGlobalPaused: !s.isGlobalPaused })),

  // Forçar retomada (usado por loadPreset)
  resumeAll: () => set({ isGlobalPaused: false }),

  // Limpar fila completamente (usado por "Parar execução")
  clearActiveSounds: () =>
    set({
      activeSounds: [],
      isGlobalMuted: false,
      isGlobalPaused: false,
      globalPreMuteVolumes: {},
    }),

  // Carregar sons de um preset (substitui fila ativa — RN-07)
  loadActiveSounds: (items) => {
    set({
      activeSounds: items.map(({ sound, volume }) => ({
        id: sound.id,
        name: sound.name,
        filePath: sound.filePath,
        volume,
        isMuted: false,
        previousVolume: null,
      })),
      isGlobalMuted: false,
      isGlobalPaused: false,
      globalPreMuteVolumes: {},
    });
  },
}));
