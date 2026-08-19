import { z } from 'zod';

export const placeRefSchema = z.object({
  provider: z.literal('geoapify'),
  placeId: z.string().min(1).max(120),
  city: z.string().min(1).max(120),
  adminArea: z.string().max(120).optional(),
  country: z.string().min(1).max(120),
  countryCode: z.string().length(2),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  label: z.string().min(1).max(240),
});

export type PlaceRef = z.infer<typeof placeRefSchema>;

export function formatPlaceLabel(input: {
  city: string;
  adminArea?: string | null;
  country: string;
}): string {
  const city = input.city.trim();
  const admin = input.adminArea?.trim();
  const country = input.country.trim();
  if (admin) {
    return `${city}, ${admin} · ${country}`;
  }
  return `${city} · ${country}`;
}
