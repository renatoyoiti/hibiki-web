import type { Preset, CreatePresetDTO, UpdatePresetDTO } from '../types';
import { API } from './api';

export const presetService = {
  list(): Promise<Preset[]> {
    return API.request('/presets');
  },

  get(id: string): Promise<Preset> {
    return API.request(`/presets/${id}`);
  },

  create(data: CreatePresetDTO): Promise<Preset> {
    return API.request('/presets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: UpdatePresetDTO): Promise<Preset> {
    return API.request(`/presets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return API.request(`/presets/${id}`, { method: 'DELETE' });
  },
};
