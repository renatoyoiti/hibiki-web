import type { Sound } from '../types';
import { API } from './api';

export const soundService = {
  list(): Promise<Sound[]> {
    return API.request('/sounds');
  },

  upload(file: File, name?: string): Promise<Sound> {
    const form = new FormData();
    form.append('file', file);
    if (name) form.append('name', name);
    return API.request('/sounds/upload', {
      method: 'POST',
      headers: {},
      body: form,
    });
  },

  toggleFavorite(id: string): Promise<Sound> {
    return API.request(`/sounds/${id}/favorite`, { method: 'PATCH' });
  },

  delete(id: string): Promise<void> {
    return API.request(`/sounds/${id}`, { method: 'DELETE' });
  },
};
