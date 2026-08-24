import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import {
  getMemberProfile,
  parseMemberProfilePlaces,
} from './profile.js';
import { getMemberRole, getUserEmailById, upsertUserByEmail } from './users.js';
import { profileCompleteness, type ProfileCompletenessField, type ProfileCompletenessInput } from '@ember/domain';

export type CommunityMemberListItem = {
  userId: string;
  email: string;
  role: string;
  invitedAt: string | null;
  joinedAt: string;
  profileComplete: boolean;
  missingFields: ProfileCompletenessField[];
  displayName: string | null;
};

export function listCommunityMembers(
  db: Database.Database,
  communityId: string,
  pepper: string,
): CommunityMemberListItem[] {
  const rows = db
    .prepare(
      `SELECT cm.user_id, cm.role, cm.invited_at, cm.created_at
       FROM community_members cm
       WHERE cm.community_id = ?
       ORDER BY cm.created_at ASC`,
    )
    .all(communityId) as Array<{
    user_id: string;
    role: string;
    invited_at: string | null;
    created_at: string;
  }>;

  return rows.map((row) => {
    const profile = getMemberProfile(db, communityId, row.user_id);
    const { originPlace, residencePlace } = parseMemberProfilePlaces(profile);
    const languages = profile?.languages_json
      ? (JSON.parse(profile.languages_json) as string[])
      : null;
    const completeness = profileCompleteness({
      displayName: profile?.display_name ?? '',
      editionYear: profile?.edition_year ?? null,
      timezone: profile?.timezone ?? null,
      languages,
      originPlace,
      residencePlace,
    } as ProfileCompletenessInput);

    return {
      userId: row.user_id,
      email: getUserEmailById(db, row.user_id, pepper) ?? '',
      role: row.role,
      invitedAt: row.invited_at,
      joinedAt: row.created_at,
      profileComplete: completeness.complete,
      missingFields: completeness.missing,
      displayName: profile?.display_name ?? null,
    };
  });
}

export function inviteCommunityMember(
  db: Database.Database,
  communityId: string,
  email: string,
  pepper: string,
  displayName?: string | null,
): { userId: string; created: boolean } {
  const userId = upsertUserByEmail(db, email, pepper);
  const existing = db
    .prepare('SELECT id, invited_at FROM community_members WHERE community_id = ? AND user_id = ?')
    .get(communityId, userId) as { id: string; invited_at: string | null } | undefined;

  const now = new Date().toISOString();
  let created = false;

  if (!existing) {
    db.prepare(
      `INSERT INTO community_members (id, community_id, user_id, role, invited_at, created_at)
       VALUES (?, ?, ?, 'member', ?, ?)`,
    ).run(randomUUID(), communityId, userId, now, now);
    created = true;
  } else if (!existing.invited_at) {
    db.prepare('UPDATE community_members SET invited_at = ? WHERE id = ?').run(now, existing.id);
  }

  if (displayName?.trim()) {
    const profile = getMemberProfile(db, communityId, userId);
    if (profile && !profile.display_name) {
      db.prepare(
        'UPDATE member_profiles SET display_name = ?, updated_at = ? WHERE community_id = ? AND user_id = ?',
      ).run(displayName.trim(), now, communityId, userId);
    }
  }

  return { userId, created };
}

export function assertOrgAdmin(
  db: Database.Database,
  communityId: string,
  userId: string,
): boolean {
  return getMemberRole(db, communityId, userId) === 'org_admin';
}
