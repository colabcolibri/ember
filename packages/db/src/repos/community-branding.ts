import type Database from 'better-sqlite3';
import {
  type CommunityBrandingInput,
  type CommunityPublicSettings,
  communityPublicSettingsSchema,
  mergeCommunityPublicSettings,
} from '@ember/domain';

export type CommunityRowWithSettings = {
  id: string;
  name: string;
  slug: string;
  public_settings_json: string | null;
};

export function findCommunityBySlugWithSettings(
  db: Database.Database,
  slug: string,
): CommunityRowWithSettings | null {
  return (
    (db
      .prepare('SELECT id, name, slug, public_settings_json FROM communities WHERE slug = ?')
      .get(slug) as CommunityRowWithSettings | undefined) ?? null
  );
}

export function parseCommunityPublicSettings(
  json: string | null | undefined,
): CommunityPublicSettings | null {
  if (!json) return null;
  try {
    const parsed = communityPublicSettingsSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function getMergedCommunityPublicSettings(
  db: Database.Database,
  slug: string,
): { community: CommunityRowWithSettings; settings: CommunityPublicSettings } | null {
  const community = findCommunityBySlugWithSettings(db, slug);
  if (!community) return null;
  const stored = parseCommunityPublicSettings(community.public_settings_json);
  return {
    community,
    settings: mergeCommunityPublicSettings(stored),
  };
}

export function updateCommunityPublicSettings(
  db: Database.Database,
  communityId: string,
  input: CommunityBrandingInput,
): CommunityPublicSettings {
  const row = db
    .prepare('SELECT public_settings_json FROM communities WHERE id = ?')
    .get(communityId) as { public_settings_json: string | null } | undefined;
  const current = mergeCommunityPublicSettings(parseCommunityPublicSettings(row?.public_settings_json));

  const next: CommunityPublicSettings = {
    hero: { ...current.hero, ...input.hero },
    introParagraph: input.introParagraph ?? current.introParagraph,
    blocks: input.blocks ?? current.blocks,
    theme: { ...current.theme, ...input.theme },
  };

  const validated = communityPublicSettingsSchema.parse(next);
  db.prepare('UPDATE communities SET public_settings_json = ? WHERE id = ?').run(
    JSON.stringify(validated),
    communityId,
  );
  return validated;
}
