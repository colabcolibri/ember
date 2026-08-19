import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import { ApiError } from './api.js';
import { formatApiError } from './api-errors.js';

const t = ((key: string) => key) as TFunction;

describe('formatApiError', () => {
  it('maps network errors', () => {
    expect(formatApiError(new ApiError('network', 'fail'), t)).toBe('common.apiNetworkError');
  });

  it('maps unauthorized errors', () => {
    expect(formatApiError(new ApiError('unauthorized', 'fail', 401), t)).toBe(
      'common.apiSessionExpired',
    );
  });

  it('uses server message when present', () => {
    expect(formatApiError(new ApiError('server', 'Boom', 500), t)).toBe('Boom');
  });

  it('falls back for unknown errors', () => {
    expect(formatApiError(new Error('x'), t)).toBe('x');
    expect(formatApiError(null, t)).toBe('common.apiGenericError');
  });
});
