import { formatPlaceLabel, placeRefSchema, type PlaceRef } from '@ember/domain';

const DEFAULT_PHOTON_BASE_URL = 'https://photon.komoot.io';

const POPULATED_PLACE_VALUES = new Set([
  'city',
  'town',
  'village',
  'hamlet',
  'municipality',
  'suburb',
  'locality',
  'isolated_dwelling',
  'neighbourhood',
  'quarter',
  'administrative',
]);

type PhotonProperties = {
  osm_type?: string;
  osm_id?: number;
  osm_key?: string;
  osm_value?: string;
  type?: string;
  name?: string;
  city?: string;
  town?: string;
  village?: string;
  district?: string;
  county?: string;
  state?: string;
  country?: string;
  countrycode?: string;
};

type PhotonFeature = {
  properties: PhotonProperties;
  geometry?: {
    coordinates?: [number, number];
  };
};

type PhotonAutocompleteResponse = {
  features?: PhotonFeature[];
};

function resolvePhotonBaseUrl(): string {
  const configured = process.env.EMBER_PHOTON_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  return DEFAULT_PHOTON_BASE_URL;
}

function isPopulatedPlace(properties: PhotonProperties): boolean {
  if (properties.osm_key === 'place') {
    return true;
  }
  return POPULATED_PLACE_VALUES.has(properties.osm_value ?? '');
}

function resolveCity(properties: PhotonProperties): string | null {
  if (isPopulatedPlace(properties) && properties.name?.trim()) {
    return properties.name.trim();
  }

  if (
    (properties.type === 'city' || properties.type === 'district') &&
    properties.name?.trim() &&
    properties.osm_value !== 'house' &&
    properties.osm_key !== 'building'
  ) {
    return properties.name.trim();
  }

  const locality =
    properties.village?.trim() ||
    properties.district?.trim() ||
    properties.town?.trim() ||
    properties.city?.trim() ||
    null;

  return locality;
}

function normalizeCountry(country: string): string {
  const trimmed = country.trim();
  const slash = trimmed.indexOf(' / ');
  if (slash > 0) {
    return trimmed.slice(0, slash).trim();
  }
  return trimmed;
}

function resolvePlaceId(properties: PhotonProperties): string | null {
  if (properties.osm_type && properties.osm_id != null) {
    return `${properties.osm_type}${properties.osm_id}`;
  }
  return null;
}

function scorePhotonFeature(feature: PhotonFeature): number {
  const { properties } = feature;
  if (properties.osm_key === 'place') {
    return 100;
  }
  if (properties.type === 'city' || properties.type === 'district') {
    return 80;
  }
  if (isPopulatedPlace(properties)) {
    return 70;
  }
  if (properties.village || properties.district) {
    return 40;
  }
  if (properties.city || properties.town) {
    return 30;
  }
  return 0;
}

export function mapPhotonFeature(feature: PhotonFeature): PlaceRef | null {
  const { properties, geometry } = feature;
  const city = resolveCity(properties);
  const country = normalizeCountry(properties.country ?? '');
  const countryCode = properties.countrycode?.toUpperCase();
  const placeId = resolvePlaceId(properties);
  const coordinates = geometry?.coordinates;
  const longitude = coordinates?.[0];
  const latitude = coordinates?.[1];

  if (!city || !country || !countryCode || !placeId || latitude == null || longitude == null) {
    return null;
  }

  const adminArea = properties.state?.trim() || properties.county?.trim() || undefined;
  const label = formatPlaceLabel({ city, adminArea, country });

  return placeRefSchema.parse({
    provider: 'photon',
    placeId,
    city,
    adminArea,
    country,
    countryCode,
    latitude,
    longitude,
    label,
  });
}

export async function fetchPhotonAutocomplete(text: string): Promise<PlaceRef[]> {
  const query = text.trim();
  if (query.length < 2) {
    return [];
  }

  const url = new URL(`${resolvePhotonBaseUrl()}/api/`);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '15');

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Ember/1.0 (community app; low-volume autocomplete)',
    },
  });
  if (!res.ok) {
    throw new Error(`Photon autocomplete failed: HTTP ${res.status}`);
  }

  const body = (await res.json()) as PhotonAutocompleteResponse;
  const ranked = (body.features ?? [])
    .map((feature) => ({
      feature,
      score: scorePhotonFeature(feature),
      mapped: mapPhotonFeature(feature),
    }))
    .filter((entry) => entry.score > 0 && entry.mapped != null)
    .sort((a, b) => b.score - a.score);

  const places: PlaceRef[] = [];
  const seenLabels = new Set<string>();

  for (const { mapped } of ranked) {
    if (!mapped || seenLabels.has(mapped.label)) {
      continue;
    }
    seenLabels.add(mapped.label);
    places.push(mapped);
    if (places.length >= 8) {
      break;
    }
  }

  return places;
}
