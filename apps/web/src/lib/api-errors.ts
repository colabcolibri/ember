import type { TFunction } from 'i18next';
import { ApiError } from './api.js';

export function formatApiError(error: unknown, t: TFunction): string {
  if (error instanceof ApiError) {
    switch (error.kind) {
      case 'network':
        return t('common.apiNetworkError');
      case 'unauthorized':
        return t('common.apiSessionExpired');
      case 'server':
        return error.message || t('common.apiServerError');
      case 'client':
        return error.message || t('common.apiClientError');
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return t('common.apiGenericError');
}
