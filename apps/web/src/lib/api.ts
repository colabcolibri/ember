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
