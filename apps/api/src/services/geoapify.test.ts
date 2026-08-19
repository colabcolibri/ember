import { describe, expect, it } from 'vitest';
import { mapGeoapifyFeature } from './geoapify.js';

describe('mapGeoapifyFeature', () => {
  it('maps city with admin area and country', () => {
    const place = mapGeoapifyFeature({
      properties: {
        place_id: '51d0a3cb',
        city: 'Campinas',
        state: 'São Paulo',
        country: 'Brazil',
        country_code: 'br',
        lat: -22.9099,
        lon: -47.0626,
      },
    });
    expect(place).toMatchObject({
      city: 'Campinas',
      adminArea: 'São Paulo',
      country: 'Brazil',
      countryCode: 'BR',
      label: 'Campinas, São Paulo · Brazil',
    });
  });

  it('returns null when city is missing', () => {
    const place = mapGeoapifyFeature({
      properties: {
        place_id: 'x',
        country: 'Brazil',
        country_code: 'br',
        lat: 0,
        lon: 0,
      },
    });
    expect(place).toBeNull();
  });
});
