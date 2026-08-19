import { Hono } from 'hono';
import type { ensureDatabaseReady } from '@ember/db';
import { profileInputSchema } from '@ember/domain';
import { getMemberProfile, getMemberRole, parseMemberProfilePlaces, upsertMemberProfile } from '@ember/db';
import { createRequireAuth, resolveCommunityId, type AppVariables } from '../lib/session.js';

type Db = ReturnType<typeof ensureDatabaseReady>;

const FACILITATOR_ROLES = new Set(['facilitador', 'org_admin']);

function isFacilitatorRole(role: string | null): boolean {
  return Boolean(role && FACILITATOR_ROLES.has(role));
}

function serializeProfile(
  communityId: string,
  userId: string,
  row: ReturnType<typeof getMemberProfile>,
  role: string | null,
) {
  const { originPlace, residencePlace } = parseMemberProfilePlaces(row);

  if (!row) {
    return {
      communityId,
      userId,
      displayName: '',
      editionYear: null as number | null,
      timezone: 'America/Sao_Paulo',
      languages: ['pt'] as string[],
      originPlace: null,
      residencePlace: null,
      updatedAt: null as string | null,
      role: role ?? 'member',
      isFacilitator: isFacilitatorRole(role),
    };
  }

  return {
    communityId: row.community_id,
    userId: row.user_id,
    displayName: row.display_name ?? '',
    editionYear: row.edition_year,
    timezone: row.timezone ?? 'America/Sao_Paulo',
    languages: row.languages_json ? (JSON.parse(row.languages_json) as string[]) : ['pt'],
    originPlace,
    residencePlace,
    updatedAt: row.updated_at,
    role: role ?? 'member',
    isFacilitator: isFacilitatorRole(role),
  };
}

export function createProfileRoutes(db: Db) {
  const profile = new Hono<{ Variables: AppVariables }>();
  const requireAuth = createRequireAuth(db);

  profile.get('/profile', requireAuth, (c) => {
    const userId = c.get('userId');
    const communityId = resolveCommunityId(c, db);
    if (!communityId) {
      return c.json({ error: { code: 'COMMUNITY_NOT_FOUND', message: 'Comunidade não encontrada' } }, 404);
    }

    const row = getMemberProfile(db, communityId, userId);
    const role = getMemberRole(db, communityId, userId);
    return c.json(serializeProfile(communityId, userId, row, role));
  });

  profile.put('/profile', requireAuth, async (c) => {
    const userId = c.get('userId');
    const communityId = resolveCommunityId(c, db);
    if (!communityId) {
      return c.json({ error: { code: 'COMMUNITY_NOT_FOUND', message: 'Comunidade não encontrada' } }, 404);
    }

    const body = await c.req.json().catch(() => null);
    const parsed = profileInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Perfil inválido', details: parsed.error.issues } },
        400,
      );
    }

    const row = upsertMemberProfile(db, communityId, userId, parsed.data);
    const role = getMemberRole(db, communityId, userId);
    return c.json(serializeProfile(communityId, userId, row, role));
  });

  return profile;
}
