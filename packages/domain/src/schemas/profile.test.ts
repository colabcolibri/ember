import { describe, expect, it } from 'vitest';
import { profileInputSchema } from './profile.js';

const samplePlace = {
  provider: 'geoapify' as const,
  placeId: 'place-lisbon',
  city: 'Lisbon',
  country: 'Portugal',
  countryCode: 'PT',
  latitude: 38.7223,
  longitude: -9.1393,
  label: 'Lisbon · Portugal',
};

describe('profileInputSchema', () => {
  it('accepts valid profile input', () => {
    const parsed = profileInputSchema.safeParse({
      displayName: 'Ana Silva',
      editionYear: 2020,
      timezone: 'Europe/Lisbon',
      languages: ['pt', 'en'],
      originPlace: samplePlace,
      residencePlace: { ...samplePlace, placeId: 'place-porto', city: 'Porto', label: 'Porto · Portugal' },
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects short display name', () => {
    const parsed = profileInputSchema.safeParse({
      displayName: 'A',
      editionYear: 2020,
      timezone: 'UTC',
      languages: ['pt'],
      originPlace: samplePlace,
      residencePlace: samplePlace,
    });
    expect(parsed.success).toBe(false);
  });
});
