import type { Context } from 'hono';
import { profileCompleteness } from '@ember/domain';
import { getMemberProfile, parseMemberProfilePlaces, type ensureDatabaseReady } from '@ember/db';
import { resolveCommunityId, type AppVariables } from './session.js';
import type { Next } from 'hono';

type Db = ReturnType<typeof ensureDatabaseReady>;

export function isMemberProfileComplete(db: Db, communityId: string, userId: string): boolean {
  const row = getMemberProfile(db, communityId, userId);
  const { originPlace, residencePlace } = parseMemberProfilePlaces(row);
  return profileCompleteness({
    displayName: row?.display_name ?? '',
    editionYear: row?.edition_year ?? null,
    timezone: row?.timezone ?? null,
    languages: row?.languages_json ? (JSON.parse(row.languages_json) as string[]) : [],
    originPlace,
    residencePlace,
  }).complete;
}

export function createRequireCompleteProfile(db: Db) {
  return async function requireCompleteProfile(
    c: Context<{ Variables: AppVariables }>,
    next: Next,
  ) {
    const userId = c.get('userId');
    const communityId = resolveCommunityId(c, db);
    if (!communityId) {
      return c.json({ error: { code: 'COMMUNITY_NOT_FOUND', message: 'Comunidade não encontrada' } }, 404);
    }

    if (!isMemberProfileComplete(db, communityId, userId)) {
      return c.json(
        {
          error: {
            code: 'PROFILE_INCOMPLETE',
            message: 'Complete seu perfil antes de continuar.',
          },
        },
        403,
      );
    }

    await next();
  };
}
