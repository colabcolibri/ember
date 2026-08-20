import { describe, expect, it } from 'vitest';
import { profileCompleteness, profileMissingFieldLabel } from './completeness.js';

describe('profileCompleteness', () => {
  it('lists missing fields for empty profile', () => {
    const result = profileCompleteness({});
    expect(result.complete).toBe(false);
    expect(result.missing).toContain('displayName');
    expect(result.missing).toContain('originPlace');
  });

  it('returns complete for full profile', () => {
    const result = profileCompleteness({
      displayName: 'Ana Silva',
      editionYear: 2020,
      timezone: 'America/Sao_Paulo',
      languages: ['pt'],
      originPlace: {
        provider: 'photon',
        placeId: '1',
        city: 'Campinas',
        country: 'Brasil',
        countryCode: 'BR',
        latitude: -22.9,
        longitude: -47.0,
        label: 'Campinas · Brasil',
      },
      residencePlace: {
        provider: 'photon',
        placeId: '2',
        city: 'Lisboa',
        country: 'Portugal',
        countryCode: 'PT',
        latitude: 38.7,
        longitude: -9.1,
        label: 'Lisboa · Portugal',
      },
    });
    expect(result.complete).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('labels fields by locale', () => {
    expect(profileMissingFieldLabel('timezone', 'pt')).toBe('fuso horário');
    expect(profileMissingFieldLabel('timezone', 'en')).toBe('timezone');
  });
});
