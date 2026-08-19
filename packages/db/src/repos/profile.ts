import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { ProfileInput } from '@ember/domain';

export type MemberProfileRow = {
  community_id: string;
  user_id: string;
  display_name: string | null;
  edition_year: number | null;
  timezone: string | null;
  languages_json: string | null;
  updated_at: string;
};

export function getMemberProfile(
  db: Database.Database,
  communityId: string,
  userId: string,
): MemberProfileRow | null {
  return (
    (db
      .prepare(
        `SELECT community_id, user_id, display_name, edition_year, timezone, languages_json, updated_at
         FROM member_profiles WHERE community_id = ? AND user_id = ?`,
      )
      .get(communityId, userId) as MemberProfileRow | undefined) ?? null
  );
}

export function upsertMemberProfile(
  db: Database.Database,
  communityId: string,
  userId: string,
  input: ProfileInput,
): MemberProfileRow {
  const now = new Date().toISOString();
  const languagesJson = JSON.stringify(input.languages);
  const existing = getMemberProfile(db, communityId, userId);
  if (existing) {
    db.prepare(
      `UPDATE member_profiles
       SET display_name = ?, edition_year = ?, timezone = ?, languages_json = ?, updated_at = ?
       WHERE community_id = ? AND user_id = ?`,
    ).run(
      input.displayName,
      input.editionYear,
      input.timezone,
      languagesJson,
      now,
      communityId,
      userId,
    );
  } else {
    db.prepare(
      `INSERT INTO member_profiles
       (id, community_id, user_id, display_name, edition_year, timezone, languages_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      randomUUID(),
      communityId,
      userId,
      input.displayName,
      input.editionYear,
      input.timezone,
      languagesJson,
      now,
    );
  }
  return getMemberProfile(db, communityId, userId)!;
}
