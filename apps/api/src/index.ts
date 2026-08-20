import { loadRepoEnv, resolveApiPort, resolveAppUrl } from '@ember/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ensureDatabaseReady } from '@ember/db';
import { createAuthRoutes } from './routes/auth.js';
import { createProfileRoutes } from './routes/profile.js';
import { createRoundRoutes } from './routes/rounds.js';
import { createCircleRoutes } from './routes/circles.js';
import { createAdminRoutes } from './routes/admin/index.js';
import { createPlacesRoutes } from './routes/places.js';
import { createPublicCommunityRoutes } from './routes/public/community.js';

loadRepoEnv();

const db = ensureDatabaseReady();

const app = new Hono();

app.use(
  '*',
  cors({
    origin: resolveAppUrl(),
    credentials: true,
  }),
);

const v1 = new Hono();

v1.get('/health', (c) => c.json({ ok: true, service: 'ember-api' }));

v1.route('/auth', createAuthRoutes(db));
v1.route('/me', createProfileRoutes(db));
v1.route('/rounds', createRoundRoutes(db));
v1.route('/circles', createCircleRoutes(db));
v1.route('/admin', createAdminRoutes(db));
v1.route('/places', createPlacesRoutes(db));
v1.route('/public', createPublicCommunityRoutes(db));

app.route('/api/v1', v1);

// Legacy dev alias
app.post('/dev/login-code', async (c) => {
  const url = new URL(c.req.url);
  url.pathname = '/api/v1/auth/code';
  return app.fetch(new Request(url.toString(), c.req.raw));
});

const port = resolveApiPort();

serve({ fetch: app.fetch, port }, (info) => {
  console.info(`[api] http://127.0.0.1:${info.port}`);
});

export { app };
