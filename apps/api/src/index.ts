import { randomBytes } from 'node:crypto';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { ensureDatabaseReady } from '@ember/db';
import {
  buildMagicLinkEmailContent,
  buildMagicLinkUrl,
  createEmailDeliveryContext,
  sendTransactionalEmail,
} from '@ember/email';

const app = new Hono();
const db = ensureDatabaseReady();

app.get('/health', (c) => c.json({ ok: true, service: 'ember-api' }));

app.post('/dev/magic-link', async (c) => {
  const body = await c.req.json<{ email?: string; ttlMinutes?: number }>();
  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return c.json({ ok: false, error: 'email inválido' }, 400);
  }

  const ttlMinutes = body.ttlMinutes ?? 15;
  const token = randomBytes(32).toString('base64url');
  const magicLinkUrl = buildMagicLinkUrl({ token });
  const content = buildMagicLinkEmailContent({ magicLinkUrl, ttlMinutes, locale: 'pt' });

  const result = await sendTransactionalEmail({
    to: email,
    subject: content.subject,
    text: content.text,
    html: content.html,
    delivery: createEmailDeliveryContext({
      kind: 'magic_link',
      db,
      meta: { locale: 'pt', expires_in_minutes: String(ttlMinutes) },
    }),
  });

  if (!result.ok) {
    return c.json({ ok: false, provider: result.provider, error: result.error }, 502);
  }

  return c.json({ ok: true, provider: result.provider, kind: 'magic_link' });
});

const port = Number(process.env.EMBER_API_PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.info(`[api] http://127.0.0.1:${info.port}`);
});
