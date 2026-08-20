import { Hono } from 'hono';
import type { ensureDatabaseReady } from '@ember/db';
import { getMergedCommunityPublicSettings } from '@ember/db';

type Db = ReturnType<typeof ensureDatabaseReady>;

export function createPublicCommunityRoutes(db: Db) {
  const publicRoutes = new Hono();

  publicRoutes.get('/community', (c) => {
    const slug =
      c.req.query('slug')?.trim() ||
      process.env.EMBER_DEFAULT_COMMUNITY_SLUG?.trim() ||
      'gsa-pilot';

    const result = getMergedCommunityPublicSettings(db, slug);
    if (!result) {
      return c.json({ error: { code: 'COMMUNITY_NOT_FOUND', message: 'Comunidade não encontrada' } }, 404);
    }

    return c.json({
      slug: result.community.slug,
      name: result.community.name,
      settings: result.settings,
    });
  });

  return publicRoutes;
}
