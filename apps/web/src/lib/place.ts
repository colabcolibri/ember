export type PlaceRef = {
  provider: 'geoapify' | 'photon';
  placeId: string;
  city: string;
  adminArea?: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  label: string;
};
