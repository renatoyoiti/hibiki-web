import { create } from 'zustand';
import type { Preset } from '../../../types';
import { presetService } from '../../../services/presetService';
import { useSoundStore } from '../../sound-control/store/soundStore';

interface PresetStore {
  presets: Preset[];
  activePresetId: string | null;

  fetchPresets(): Promise<void>;
  createPreset(name: string): Promise<void>;
  updatePreset(id: string, data?: { name?: string }): Promise<void>;
  deletePreset(id: string): Promise<void>;
  loadPreset(preset: Preset): void;
  setActivePresetId(id: string | null): void;
}

export const usePresetStore = create<PresetStore>((set, get) => ({
  presets: [],
  activePresetId: null,

  fetchPresets: async () => {
    const presets = await presetService.list();
    set({ presets });
  },

  // Captura o estado atual da fila (activeSounds) e salva como preset
  createPreset: async (name) => {
    const { activeSounds } = useSoundStore.getState();
    const sounds = activeSounds.map((s) => ({ soundId: s.id, volume: s.volume }));
    await presetService.create({ name, sounds });
    await get().fetchPresets();
  },

  // Se data.name fornecido: renomeia. Caso contrário: atualiza sons com fila atual.
  updatePreset: async (id, data) => {
    if (data?.name !== undefined) {
      await presetService.update(id, { name: data.name });
    } else {
      const { activeSounds } = useSoundStore.getState();
      const sounds = activeSounds.map((s) => ({ soundId: s.id, volume: s.volume }));
      await presetService.update(id, { sounds });
    }
    await get().fetchPresets();
  },

  // Guard: não deletar preset ativo. Soft delete via API.
  deletePreset: async (id) => {
    if (id === get().activePresetId) return;
    await presetService.delete(id);
    await get().fetchPresets();
  },

  // Substitui a fila ativa com os sons do preset (RN-07).
  // Sons não encontrados na biblioteca local são ignorados.
  loadPreset: (preset) => {
    const soundStore = useSoundStore.getState();
    const items = preset.sounds
      .map((s) => {
        const sound = soundStore.sounds.find((lib) => lib.id === s.soundId);
        if (!sound) return null;
        return { sound, volume: s.volume };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    soundStore.loadActiveSounds(items);
    soundStore.resumeAll();
    set({ activePresetId: preset.id });
  },

  setActivePresetId: (id) => set({ activePresetId: id }),
}));
