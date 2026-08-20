import { Hono } from 'hono';
import type { ensureDatabaseReady } from '@ember/db';
import { getMergedCommunityPublicSettings, updateCommunityPublicSettings } from '@ember/db';
import { communityBrandingInputSchema } from '@ember/domain';
import { createRequireOrgAdmin, type OrgAdminVariables } from '../../lib/org-admin.js';

type Db = ReturnType<typeof ensureDatabaseReady>;

export function createAdminBrandingRoutes(db: Db) {
  const branding = new Hono<{ Variables: OrgAdminVariables }>();
  const requireOrgAdmin = createRequireOrgAdmin(db);

  branding.get('/community/branding', requireOrgAdmin, (c) => {
    const communityId = c.get('communityId');
    const slug = process.env.EMBER_DEFAULT_COMMUNITY_SLUG?.trim() || 'gsa-pilot';
    const result = getMergedCommunityPublicSettings(db, slug);
    if (!result || result.community.id !== communityId) {
      return c.json({ error: { code: 'COMMUNITY_NOT_FOUND', message: 'Comunidade não encontrada' } }, 404);
    }

    return c.json({
      slug: result.community.slug,
      name: result.community.name,
      settings: result.settings,
    });
  });

  branding.put('/community/branding', requireOrgAdmin, async (c) => {
    const communityId = c.get('communityId');
    const body = await c.req.json().catch(() => null);
    const parsed = communityBrandingInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Branding inválido', details: parsed.error.issues } },
        400,
      );
    }

    const settings = updateCommunityPublicSettings(db, communityId, parsed.data);
    const slug = process.env.EMBER_DEFAULT_COMMUNITY_SLUG?.trim() || 'gsa-pilot';
    const community = getMergedCommunityPublicSettings(db, slug);
    return c.json({
      slug: community?.community.slug ?? slug,
      name: community?.community.name ?? '',
      settings,
    });
  });

  return branding;
}
