import type { ensureDatabaseReady } from '@ember/db';
import { upsertMemberProfile } from '@ember/db';

export const completeTestPlace = {
  provider: 'photon' as const,
  placeId: 'R298019',
  city: 'São Paulo',
  adminArea: 'SP',
  country: 'Brazil',
  countryCode: 'BR',
  latitude: -23.55,
  longitude: -46.63,
  label: 'São Paulo, SP · Brazil',
};

export function seedCompleteMemberProfile(
  db: ReturnType<typeof ensureDatabaseReady>,
  communityId: string,
  userId: string,
  overrides: Partial<{
    displayName: string;
    editionYear: number;
    timezone: string;
    languages: string[];
  }> = {},
) {
  upsertMemberProfile(db, communityId, userId, {
    displayName: 'Test User',
    editionYear: 2020,
    timezone: 'America/Sao_Paulo',
    languages: ['pt'],
    originPlace: completeTestPlace,
    residencePlace: completeTestPlace,
    ...overrides,
  });
}
