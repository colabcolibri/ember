import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { PlaceRef, ProfileInput } from '@ember/domain';
import { placeRefSchema } from '@ember/domain';

export type MemberProfileRow = {
  community_id: string;
  user_id: string;
  display_name: string | null;
  edition_year: number | null;
  timezone: string | null;
  languages_json: string | null;
  origin_place_json: string | null;
  residence_place_json: string | null;
  updated_at: string;
};

function parsePlaceJson(raw: string | null): PlaceRef | null {
  if (!raw) return null;
  try {
    return placeRefSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function getMemberProfile(
  db: Database.Database,
  communityId: string,
  userId: string,
): MemberProfileRow | null {
  return (
    (db
      .prepare(
        `SELECT community_id, user_id, display_name, edition_year, timezone, languages_json,
                origin_place_json, residence_place_json, updated_at
         FROM member_profiles WHERE community_id = ? AND user_id = ?`,
      )
      .get(communityId, userId) as MemberProfileRow | undefined) ?? null
  );
}

export function parseMemberProfilePlaces(row: MemberProfileRow | null): {
  originPlace: PlaceRef | null;
  residencePlace: PlaceRef | null;
} {
  if (!row) {
    return { originPlace: null, residencePlace: null };
  }
  return {
    originPlace: parsePlaceJson(row.origin_place_json),
    residencePlace: parsePlaceJson(row.residence_place_json),
  };
}

export function upsertMemberProfile(
  db: Database.Database,
  communityId: string,
  userId: string,
  input: ProfileInput,
): MemberProfileRow {
  const now = new Date().toISOString();
  const languagesJson = JSON.stringify(input.languages);
  const originJson = JSON.stringify(input.originPlace);
  const residenceJson = JSON.stringify(input.residencePlace);
  const existing = getMemberProfile(db, communityId, userId);
  if (existing) {
    db.prepare(
      `UPDATE member_profiles
       SET display_name = ?, edition_year = ?, timezone = ?, languages_json = ?,
           origin_place_json = ?, residence_place_json = ?, updated_at = ?
       WHERE community_id = ? AND user_id = ?`,
    ).run(
      input.displayName,
      input.editionYear,
      input.timezone,
      languagesJson,
      originJson,
      residenceJson,
      now,
      communityId,
      userId,
    );
  } else {
    db.prepare(
      `INSERT INTO member_profiles
       (id, community_id, user_id, display_name, edition_year, timezone, languages_json,
        origin_place_json, residence_place_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      randomUUID(),
      communityId,
      userId,
      input.displayName,
      input.editionYear,
      input.timezone,
      languagesJson,
      originJson,
      residenceJson,
      now,
    );
  }
  return getMemberProfile(db, communityId, userId)!;
}

export function updateMemberTimezone(
  db: Database.Database,
  communityId: string,
  userId: string,
  timezone: string,
): void {
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE member_profiles SET timezone = ?, updated_at = ? WHERE community_id = ? AND user_id = ?`,
  ).run(timezone, now, communityId, userId);
}
