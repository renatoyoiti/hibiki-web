export interface Sound {
  id: string;
  name: string;
  filePath: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface PresetSoundItem {
  soundId: string;
  name: string;
  volume: number;
}

export interface Preset {
  id: string;
  name: string;
  sounds: PresetSoundItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePresetDTO {
  name: string;
  sounds: Array<{ soundId: string; volume: number }>;
}

export interface UpdatePresetDTO {
  name?: string;
  sounds?: Array<{ soundId: string; volume: number }>;
}

export interface ActiveSound {
  id: string;
  name: string;
  filePath: string;
  volume: number;
  isMuted: boolean;
  previousVolume: number | null;
}
