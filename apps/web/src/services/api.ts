const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body?.error?.message ?? 'Erro na requisição');
    (err as Error & { code?: string }).code = body?.error?.code;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const API = { request, base: API_BASE };
