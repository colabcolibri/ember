import { describe, expect, it } from 'vitest';
import pt from './locales/pt.json';
import en from './locales/en.json';

const KEYS = ['app.title', 'login.title', 'profile.title', 'presence.title'] as const;

function get(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

describe('i18n locales', () => {
  it('has core keys in pt and en', () => {
    for (const key of KEYS) {
      expect(get(pt, key)).toBeTruthy();
      expect(get(en, key)).toBeTruthy();
    }
  });
});
