import type Database from 'better-sqlite3';

export type CommunityRow = {
  id: string;
  name: string;
  slug: string;
};

export function findCommunityBySlug(db: Database.Database, slug: string): CommunityRow | null {
  return (
    (db
      .prepare('SELECT id, name, slug FROM communities WHERE slug = ?')
      .get(slug) as CommunityRow | undefined) ?? null
  );
}

export function findCommunityById(db: Database.Database, id: string): CommunityRow | null {
  return (
    (db.prepare('SELECT id, name, slug FROM communities WHERE id = ?').get(id) as CommunityRow | undefined) ??
    null
  );
}
