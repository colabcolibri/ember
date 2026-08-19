import { formatPlaceLabel, placeRefSchema, type PlaceRef } from '@ember/domain';

type GeoapifyFeature = {
  properties: {
    place_id?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
    lat?: number;
    lon?: number;
    formatted?: string;
  };
};

type GeoapifyAutocompleteResponse = {
  results?: GeoapifyFeature[];
};

function resolveCity(properties: GeoapifyFeature['properties']): string | null {
  return properties.city ?? properties.town ?? properties.village ?? null;
}

export function mapGeoapifyFeature(feature: GeoapifyFeature): PlaceRef | null {
  const { properties } = feature;
  const city = resolveCity(properties);
  const country = properties.country;
  const countryCode = properties.country_code?.toUpperCase();
  const placeId = properties.place_id;
  const latitude = properties.lat;
  const longitude = properties.lon;

  if (!city || !country || !countryCode || !placeId || latitude == null || longitude == null) {
    return null;
  }

  const adminArea = properties.state?.trim() || undefined;
  const label = formatPlaceLabel({ city, adminArea, country });

  return placeRefSchema.parse({
    provider: 'geoapify',
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

export async function fetchGeoapifyAutocomplete(
  text: string,
  apiKey: string,
): Promise<PlaceRef[]> {
  const query = text.trim();
  if (query.length < 2) {
    return [];
  }

  const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
  url.searchParams.set('text', query);
  url.searchParams.set('type', 'city');
  url.searchParams.set('limit', '8');
  url.searchParams.set('format', 'json');
  url.searchParams.set('apiKey', apiKey);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Geoapify autocomplete failed: HTTP ${res.status}`);
  }

  const body = (await res.json()) as GeoapifyAutocompleteResponse;
  const places: PlaceRef[] = [];
  for (const feature of body.results ?? []) {
    const mapped = mapGeoapifyFeature(feature);
    if (mapped) {
      places.push(mapped);
    }
  }
  return places;
}
