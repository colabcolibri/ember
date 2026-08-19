import { Hono } from 'hono';
import type { ensureDatabaseReady } from '@ember/db';
import { profileInputSchema } from '@ember/domain';
import { getMemberProfile, upsertMemberProfile } from '@ember/db';
import { createRequireAuth, resolveCommunityId, type AppVariables } from '../lib/session.js';

type Db = ReturnType<typeof ensureDatabaseReady>;

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
    if (!row) {
      return c.json({
        communityId,
        userId,
        timezone: 'America/Sao_Paulo',
        languages: ['pt'],
        updatedAt: null,
      });
    }

    return c.json({
      communityId: row.community_id,
      userId: row.user_id,
      timezone: row.timezone ?? 'America/Sao_Paulo',
      languages: row.languages_json ? (JSON.parse(row.languages_json) as string[]) : ['pt'],
      updatedAt: row.updated_at,
    });
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
    return c.json({
      communityId: row.community_id,
      userId: row.user_id,
      timezone: row.timezone,
      languages: JSON.parse(row.languages_json ?? '["pt"]'),
      updatedAt: row.updated_at,
    });
  });

  return profile;
}
