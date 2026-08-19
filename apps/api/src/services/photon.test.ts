import { describe, expect, it } from 'vitest';
import { mapPhotonFeature } from './photon.js';

describe('mapPhotonFeature', () => {
  it('maps city with admin area and country from Photon GeoJSON', () => {
    const place = mapPhotonFeature({
      properties: {
        osm_type: 'R',
        osm_id: 298019,
        type: 'city',
        name: 'São José dos Campos',
        state: 'São Paulo',
        country: 'Brasil',
        countrycode: 'br',
      },
      geometry: {
        coordinates: [-45.8854538, -23.1867782],
      },
    });
    expect(place).toMatchObject({
      provider: 'photon',
      placeId: 'R298019',
      city: 'São José dos Campos',
      adminArea: 'São Paulo',
      country: 'Brasil',
      countryCode: 'BR',
      label: 'São José dos Campos, São Paulo · Brasil',
    });
  });

  it('returns null when city name is missing', () => {
    const place = mapPhotonFeature({
      properties: {
        osm_type: 'R',
        osm_id: 1,
        country: 'België / Belgique / Belgien',
        countrycode: 'be',
      },
      geometry: {
        coordinates: [0, 0],
      },
    });
    expect(place).toBeNull();
  });

  it('normalizes multi-language country labels from Photon', () => {
    const place = mapPhotonFeature({
      properties: {
        osm_type: 'R',
        osm_id: 3873203,
        osm_key: 'place',
        osm_value: 'village',
        type: 'district',
        name: 'Tielen',
        state: 'Antwerpen',
        country: 'België / Belgique / Belgien',
        countrycode: 'be',
      },
      geometry: {
        coordinates: [4.8965455, 51.2422595],
      },
    });
    expect(place).toMatchObject({
      city: 'Tielen',
      country: 'België',
      countryCode: 'BE',
      label: 'Tielen, Antwerpen · België',
    });
  });

  it('resolves village from street address via district field', () => {
    const place = mapPhotonFeature({
      properties: {
        osm_type: 'W',
        osm_id: 378573988,
        osm_key: 'building',
        osm_value: 'house',
        type: 'house',
        housenumber: '21A',
        street: 'Gierlebaan',
        district: 'Tielen',
        city: 'Kasterlee',
        state: 'Antwerpen',
        country: 'België / Belgique / Belgien',
        countrycode: 'be',
      },
      geometry: {
        coordinates: [4.8943726, 51.244508],
      },
    });
    expect(place).toMatchObject({
      city: 'Tielen',
      adminArea: 'Antwerpen',
      label: 'Tielen, Antwerpen · België',
    });
  });
});
