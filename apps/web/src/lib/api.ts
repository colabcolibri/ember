import { isMockMode } from './mock-mode.js';
import { mockApiDownload, mockApiFetch } from '../mock/api.js';

const API_BASE = '/api/v1';

export type ApiErrorKind = 'network' | 'unauthorized' | 'client' | 'server';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (isMockMode) {
    return mockApiFetch<T>(path, init);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError('network', 'Network request failed');
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    const message = body?.error?.message ?? `HTTP ${res.status}`;

    if (res.status === 401) {
      throw new ApiError('unauthorized', message, 401);
    }
    if (res.status >= 500) {
      throw new ApiError('server', message, res.status);
    }
    throw new ApiError('client', message, res.status);
  }

  return res.json() as Promise<T>;
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function apiDownload(path: string, filename: string): Promise<void> {
  if (isMockMode) {
    const { blob, filename: resolvedName } = await mockApiDownload(path);
    triggerBrowserDownload(blob, filename || resolvedName);
    return;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
    });
  } catch {
    throw new ApiError('network', 'Network request failed');
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    const message = body?.error?.message ?? `HTTP ${res.status}`;
    if (res.status === 401) throw new ApiError('unauthorized', message, 401);
    if (res.status >= 500) throw new ApiError('server', message, res.status);
    throw new ApiError('client', message, res.status);
  }

  const blob = await res.blob();
  triggerBrowserDownload(blob, filename);
}
