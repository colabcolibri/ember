import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { assertOrgAdmin, findValidSession, type ensureDatabaseReady } from '@ember/db';
import { resolveCommunityId, SESSION_COOKIE, type AppVariables } from './session.js';
import { isMemberProfileComplete } from './complete-profile.js';

type Db = ReturnType<typeof ensureDatabaseReady>;

export type OrgAdminVariables = AppVariables & {
  communityId: string;
};

export function createRequireOrgAdmin(db: Db) {
  return async function requireOrgAdmin(
    c: Context<{ Variables: OrgAdminVariables }>,
    next: Next,
  ) {
    const sessionId = getCookie(c, SESSION_COOKIE);
    if (!sessionId) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Sessão necessária' } }, 401);
    }
    const session = findValidSession(db, sessionId);
    if (!session) {
      return c.json({ error: { code: 'SESSION_EXPIRED', message: 'Sessão expirada' } }, 401);
    }
    c.set('userId', session.user_id);
    c.set('sessionId', session.id);

    const communityId = resolveCommunityId(c, db);
    if (!communityId) {
      return c.json({ error: { code: 'COMMUNITY_NOT_FOUND', message: 'Comunidade não encontrada' } }, 404);
    }

    if (!assertOrgAdmin(db, communityId, session.user_id)) {
      return c.json({ error: { code: 'FORBIDDEN', message: 'Acesso restrito ao admin da organização' } }, 403);
    }

    if (!isMemberProfileComplete(db, communityId, session.user_id)) {
      return c.json(
        { error: { code: 'PROFILE_INCOMPLETE', message: 'Complete seu perfil antes de continuar.' } },
        403,
      );
    }

    c.set('communityId', communityId);
    await next();
  };
}
