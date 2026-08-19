import { Hono } from 'hono';
import type { ensureDatabaseReady } from '@ember/db';
import { createRequireAuth, type AppVariables } from '../lib/session.js';
import { fetchGeoapifyAutocomplete } from '../services/geoapify.js';

type Db = ReturnType<typeof ensureDatabaseReady>;

function resolveGeoapifyApiKey(): string | null {
  return process.env.EMBER_GEOAPIFY_API_KEY?.trim() || null;
}

export function createPlacesRoutes(_db: Db) {
  const places = new Hono<{ Variables: AppVariables }>();
  const requireAuth = createRequireAuth(_db);

  places.get('/autocomplete', requireAuth, async (c) => {
    const apiKey = resolveGeoapifyApiKey();
    if (!apiKey) {
      return c.json(
        {
          error: {
            code: 'GEOAPIFY_NOT_CONFIGURED',
            message: 'Busca de lugares indisponível — configure EMBER_GEOAPIFY_API_KEY',
          },
        },
        503,
      );
    }

    const text = c.req.query('text') ?? '';
    if (text.trim().length < 2) {
      return c.json({ items: [] as const });
    }

    try {
      const items = await fetchGeoapifyAutocomplete(text, apiKey);
      return c.json({ items });
    } catch {
      return c.json(
        { error: { code: 'GEOAPIFY_ERROR', message: 'Não foi possível buscar lugares agora' } },
        502,
      );
    }
  });

  return places;
}
