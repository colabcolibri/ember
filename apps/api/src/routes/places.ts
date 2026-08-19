import { Hono } from 'hono';
import type { ensureDatabaseReady } from '@ember/db';
import { createRequireAuth, type AppVariables } from '../lib/session.js';
import { fetchPhotonAutocomplete } from '../services/photon.js';

type Db = ReturnType<typeof ensureDatabaseReady>;

export function createPlacesRoutes(_db: Db) {
  const places = new Hono<{ Variables: AppVariables }>();
  const requireAuth = createRequireAuth(_db);

  places.get('/autocomplete', requireAuth, async (c) => {
    const text = c.req.query('text') ?? '';
    if (text.trim().length < 2) {
      return c.json({ items: [] as const });
    }

    try {
      const items = await fetchPhotonAutocomplete(text);
      return c.json({ items });
    } catch {
      return c.json(
        { error: { code: 'PHOTON_ERROR', message: 'Não foi possível buscar lugares agora' } },
        502,
      );
    }
  });

  return places;
}
