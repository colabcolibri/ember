import type { Context, Next } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { findValidSession, type ensureDatabaseReady } from '@ember/db';

type Db = ReturnType<typeof ensureDatabaseReady>;

export const SESSION_COOKIE = 'ember_session';

export type AppVariables = {
  userId: string;
  sessionId: string;
};

export function createRequireAuth(db: Db) {
  return async function requireAuth(c: Context<{ Variables: AppVariables }>, next: Next) {
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
    await next();
  };
}

export function setSessionCookie(c: Context, sessionId: string, expiresAt: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  setCookie(c, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'Lax',
    path: '/',
    expires: new Date(expiresAt),
  });
}

export function clearSessionCookie(c: Context): void {
  const isProd = process.env.NODE_ENV === 'production';
  setCookie(c, SESSION_COOKIE, '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'Lax',
    path: '/',
    maxAge: 0,
  });
}

export function resolveCommunityId(c: Context, db: Db): string | null {
  const header = c.req.header('X-Community-Id')?.trim();
  if (header) return header;
  const slug = process.env.EMBER_DEFAULT_COMMUNITY_SLUG?.trim() || 'gsa-pilot';
  const row = db.prepare('SELECT id FROM communities WHERE slug = ?').get(slug) as
    | { id: string }
    | undefined;
  return row?.id ?? null;
}
