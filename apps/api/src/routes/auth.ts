import { Hono } from 'hono';
import type { ensureDatabaseReady } from '@ember/db';
import { requireEmailPepper } from '@ember/email';
import {
  buildMagicLinkEmailContent,
  buildMagicLinkUrl,
  createEmailDeliveryContext,
  sendTransactionalEmail,
} from '@ember/email';
import { magicLinkRequestSchema } from '@ember/domain';
import {
  createMagicToken,
  createSession,
  findCommunityBySlug,
  findValidMagicToken,
  markMagicTokenUsed,
  resolveEmailFromMagicToken,
  upsertUserByEmail,
  ensureCommunityMember,
} from '@ember/db';
import { createRateLimit, resetRateLimitsForTests } from '../lib/rate-limit.js';
import { setSessionCookie } from '../lib/session.js';

type Db = ReturnType<typeof ensureDatabaseReady>;

const GENERIC_MESSAGE =
  'Se o email estiver cadastrado, você receberá um link em breve.';

export function createAuthRoutes(db: Db) {
  const auth = new Hono();

  const magicLinkRateLimit = createRateLimit({
    limit: 5,
    windowMs: 60 * 60 * 1000,
    keyPrefix: 'magic-link',
  });

  auth.post('/magic-link', magicLinkRateLimit, async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = magicLinkRequestSchema.safeParse(body);
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

    const { token } = createMagicToken(db, email, pepper);
    const magicLinkUrl = buildMagicLinkUrl({ token });
    const content = buildMagicLinkEmailContent({ magicLinkUrl, ttlMinutes: 15, locale: 'pt' });

    await sendTransactionalEmail({
      to: email,
      subject: content.subject,
      text: content.text,
      html: content.html,
      delivery: createEmailDeliveryContext({
        kind: 'magic_link',
        db,
        meta: {
          locale: 'pt',
          community_slug: communitySlug,
          ...(community ? { community_id: community.id } : {}),
        },
      }),
    });

    return c.json({ message: GENERIC_MESSAGE }, 202);
  });

  auth.get('/magic-link/verify', async (c) => {
    const token = c.req.query('token')?.trim();
    if (!token) {
      return c.json({ error: { code: 'INVALID_TOKEN', message: 'Token ausente' } }, 400);
    }

    const row = findValidMagicToken(db, token);
    if (!row) {
      return c.json(
        { error: { code: 'TOKEN_EXPIRED', message: 'Link expirado ou inválido. Solicite um novo.' } },
        410,
      );
    }

    const pepper = requireEmailPepper();
    const email = resolveEmailFromMagicToken(row, pepper);
    if (!email) {
      return c.json({ error: { code: 'INVALID_TOKEN', message: 'Token inválido' } }, 410);
    }

    markMagicTokenUsed(db, row.id);
    const userId = upsertUserByEmail(db, email, pepper);

    const communitySlug = process.env.EMBER_DEFAULT_COMMUNITY_SLUG ?? 'gsa-pilot';
    const community = findCommunityBySlug(db, communitySlug);
    if (community) {
      ensureCommunityMember(db, community.id, userId);
    }

    const { sessionId, expiresAt } = createSession(db, userId);
    setSessionCookie(c, sessionId, expiresAt);

    const appUrl = (process.env.EMBER_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const wantsJson = c.req.header('accept')?.includes('application/json');
    if (wantsJson) {
      return c.json({ ok: true, redirect: appUrl });
    }
    return c.redirect(appUrl, 302);
  });

  return auth;
}

export { resetRateLimitsForTests };
