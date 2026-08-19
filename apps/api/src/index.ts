import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ensureDatabaseReady } from '@ember/db';
import { createAuthRoutes } from './routes/auth.js';
import { createProfileRoutes } from './routes/profile.js';
import { createRoundRoutes } from './routes/rounds.js';

const db = ensureDatabaseReady();

const app = new Hono();

app.use(
  '*',
  cors({
    origin: process.env.EMBER_APP_URL ?? 'http://localhost:3000',
    credentials: true,
  }),
);

const v1 = new Hono();

v1.get('/health', (c) => c.json({ ok: true, service: 'ember-api' }));

v1.route('/auth', createAuthRoutes(db));
v1.route('/me', createProfileRoutes(db));
v1.route('/rounds', createRoundRoutes(db));

app.route('/api/v1', v1);

// Legacy dev endpoint — redirect to v1
app.post('/dev/magic-link', async (c) => {
  const url = new URL(c.req.url);
  url.pathname = '/api/v1/auth/magic-link';
  return app.fetch(new Request(url.toString(), c.req.raw));
});

const port = Number(process.env.EMBER_API_PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.info(`[api] http://127.0.0.1:${info.port}`);
});

export { app };
