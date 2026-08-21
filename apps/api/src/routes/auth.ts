import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import type { ensureDatabaseReady } from '@ember/db';
import { requireEmailPepper } from '@ember/email';
import { buildLoginCodeEmailContent, createEmailDeliveryContext, sendTransactionalEmail } from '@ember/email';
import { loginCodeRequestSchema, loginCodeVerifySchema } from '@ember/domain';
import {
  createLoginCode,
  createSession,
  deleteSession,
  ensureCommunityMember,
  findCommunityBySlug,
  findValidLoginCode,
  findValidSession,
  getMemberRole,
  markLoginCodeUsed,
  resolveEmailFromLoginCode,
  upsertUserByEmail,
} from '@ember/db';
import { resolveBootstrapAdminEmail } from '../lib/bootstrap-admin.js';
import { createRateLimit, resetRateLimitsForTests } from '../lib/rate-limit.js';
import { resolveCommunityId, setSessionCookie, clearSessionCookie, SESSION_COOKIE } from '../lib/session.js';

const FACILITATOR_ROLES = new Set(['facilitador', 'org_admin']);

type Db = ReturnType<typeof ensureDatabaseReady>;

const CODE_TTL_MINUTES = 15;

const GENERIC_MESSAGE =
  'Se o email estiver cadastrado, você receberá um código em breve.';

function bootstrapUser(db: Db, email: string, pepper: string): string {
  const userId = upsertUserByEmail(db, email, pepper);
  const communitySlug = process.env.EMBER_DEFAULT_COMMUNITY_SLUG ?? 'gsa-pilot';
  const community = findCommunityBySlug(db, communitySlug);
  if (community) {
    const bootstrapEmail = resolveBootstrapAdminEmail();
    const role =
      bootstrapEmail && email.toLowerCase() === bootstrapEmail ? 'org_admin' : 'member';
    ensureCommunityMember(db, community.id, userId, role);
  }
  return userId;
}

export function createAuthRoutes(db: Db) {
  const auth = new Hono();

  const codeRequestRateLimit = createRateLimit({
    limit: 5,
    windowMs: 60 * 60 * 1000,
    keyPrefix: 'login-code-request',
  });

  const codeVerifyRateLimit = createRateLimit({
    limit: 10,
    windowMs: 15 * 60 * 1000,
    keyPrefix: 'login-code-verify',
  });

  auth.get('/session', (c) => {
    const sessionId = getCookie(c, SESSION_COOKIE);
    if (!sessionId) {
      return c.json({ authenticated: false });
    }

    const session = findValidSession(db, sessionId);
    if (!session) {
      return c.json({ authenticated: false });
    }

    const communityId = resolveCommunityId(c, db);
    const role = communityId ? (getMemberRole(db, communityId, session.user_id) ?? 'member') : 'member';

    return c.json({
      authenticated: true,
      role,
      isFacilitator: FACILITATOR_ROLES.has(role),
      isOrgAdmin: role === 'org_admin',
    });
  });

  auth.post('/code', codeRequestRateLimit, async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = loginCodeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Email inválido', details: parsed.error.issues } },
        400,
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const pepper = requireEmailPepper();
    const communitySlug = parsed.data.communitySlug ?? process.env.EMBER_DEFAULT_COMMUNITY_SLUG ?? 'gsa-pilot';
    const community = findCommunityBySlug(db, communitySlug);

    const { code } = createLoginCode(db, email, pepper);
    const content = buildLoginCodeEmailContent({ code, ttlMinutes: CODE_TTL_MINUTES, locale: 'pt' });

    const sendResult = await sendTransactionalEmail({
      to: email,
      subject: content.subject,
      text: content.text,
      html: content.html,
      delivery: createEmailDeliveryContext({
        kind: 'login_code',
        db,
        meta: {
          locale: 'pt',
          community_slug: communitySlug,
          ...(community ? { community_id: community.id } : {}),
        },
      }),
    });

    if (!sendResult.ok) {
      console.error('[auth] login code email failed', {
        provider: sendResult.provider,
        error: sendResult.error,
      });
      return c.json(
        {
          error: {
            code: 'EMAIL_UNAVAILABLE',
            message: 'Não foi possível enviar o código agora. Tente novamente em instantes.',
          },
        },
        503,
      );
    }

    return c.json({ message: GENERIC_MESSAGE }, 202);
  });

  auth.post('/code/verify', codeVerifyRateLimit, async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = loginCodeVerifySchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Código inválido', details: parsed.error.issues } },
        400,
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const pepper = requireEmailPepper();
    const row = findValidLoginCode(db, email, parsed.data.code, pepper);
    if (!row) {
      return c.json(
        { error: { code: 'CODE_INVALID', message: 'Código expirado ou inválido. Solicite um novo.' } },
        401,
      );
    }

    const resolvedEmail = resolveEmailFromLoginCode(row, pepper);
    if (!resolvedEmail) {
      return c.json({ error: { code: 'CODE_INVALID', message: 'Código inválido' } }, 401);
    }

    markLoginCodeUsed(db, row.id);
    const userId = bootstrapUser(db, resolvedEmail, pepper);
    const { sessionId, expiresAt } = createSession(db, userId);
    setSessionCookie(c, sessionId, expiresAt);

    return c.json({ ok: true });
  });

  auth.post('/logout', async (c) => {
    const sessionId = getCookie(c, SESSION_COOKIE);
    if (sessionId) {
      deleteSession(db, sessionId);
    }
    clearSessionCookie(c);
    return c.json({ ok: true });
  });

  return auth;
}

export { resetRateLimitsForTests };
