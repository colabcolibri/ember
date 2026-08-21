import type Database from 'better-sqlite3';
import type { GroupProposal, ProfileInput } from '@ember/domain';
import {
  DEV_PLACES,
  DEV_ROUND_SEEDS,
  DEV_ROUND_SLOT_REFS,
  DEV_TEMPLATES,
  DEV_USERS,
  buildMatchDraftFromDeclarations,
  buildRoundDeclarations,
} from '@ember/domain/fixtures/dev-population';
import { publishGroupsWithDelivery } from './repos/circles.js';
import { upsertMatchingRoundDraft } from './repos/matching-drafts.js';
import { upsertMemberProfile } from './repos/profile.js';
import { upsertRoundDeclaration } from './repos/rounds.js';
import { ensureCommunityMember, upsertUserByEmail } from './repos/users.js';

const COMMUNITY_ID = 'comm-gsa';

export type SeedDevPopulationResult = {
  communityId: string;
  users: number;
  templates: number;
  rounds: number;
  declarations: number;
  circles: number;
  matchDrafts: number;
};

function requirePepper(): string {
  const pepper = process.env.EMBER_EMAIL_PEPPER?.trim();
  if (!pepper) {
    throw new Error('EMBER_EMAIL_PEPPER is required to seed demo users (see .env.example)');
  }
  return pepper;
}

function ensureExtendedSlotCalendars(db: Database.Database, communityId: string): void {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT OR IGNORE INTO slot_calendars (id, community_id, label, anchor_timezone, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run('cal-asia', communityId, 'Asia-Pacific', 'Asia/Tokyo', now);

  const entries: Array<[string, string, number, number, number, number]> = [
    ['slot-tue-2000', 'cal-europe', 2, 20, 0, 4],
    ['slot-sat-1000-asia', 'cal-asia', 6, 10, 0, 1],
  ];

  for (const [id, calendarId, weekday, hour, minute, sortOrder] of entries) {
    db.prepare(
      `INSERT OR IGNORE INTO slot_calendar_entries (id, calendar_id, weekday, hour, minute, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, calendarId, weekday, hour, minute, sortOrder);
  }
}

function clearCommunityDemoData(db: Database.Database, communityId: string): void {
  db.prepare(
    `DELETE FROM circle_reminder_jobs
     WHERE circle_id IN (
       SELECT c.id FROM circles c
       JOIN rounds r ON r.id = c.round_id
       WHERE r.community_id = ?
     )`,
  ).run(communityId);

  db.prepare(
    `DELETE FROM circle_members
     WHERE circle_id IN (
       SELECT c.id FROM circles c
       JOIN rounds r ON r.id = c.round_id
       WHERE r.community_id = ?
     )`,
  ).run(communityId);

  db.prepare(
    `DELETE FROM circles
     WHERE round_id IN (SELECT id FROM rounds WHERE community_id = ?)`,
  ).run(communityId);

  db.prepare(
    `DELETE FROM matching_round_drafts
     WHERE round_id IN (SELECT id FROM rounds WHERE community_id = ?)`,
  ).run(communityId);

  db.prepare(
    `DELETE FROM round_declarations
     WHERE round_id IN (SELECT id FROM rounds WHERE community_id = ?)`,
  ).run(communityId);

  db.prepare('DELETE FROM rounds WHERE community_id = ?').run(communityId);
}

function ensureTemplates(db: Database.Database, communityId: string): void {
  const now = new Date().toISOString();
  for (const template of DEV_TEMPLATES) {
    db.prepare(
      `INSERT INTO meeting_templates (id, community_id, name, circle_size, duration_minutes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         circle_size = excluded.circle_size,
         duration_minutes = excluded.duration_minutes`,
    ).run(
      template.id,
      communityId,
      template.name,
      template.circleSize,
      template.durationMinutes,
      now,
    );
  }
}

function memberRoleForUser(email: string, index: number): string {
  if (email === 'facilitador@demo.ember') return 'facilitador';
  if (email === 'admin@demo.ember') return 'org_admin';
  if (index === 1 || index === 2) return 'facilitador';
  return 'member';
}

function seedUsers(
  db: Database.Database,
  communityId: string,
  pepper: string,
): Map<string, string> {
  const mockIdToDbId = new Map<string, string>();

  DEV_USERS.forEach((user, index) => {
    const userId = upsertUserByEmail(db, user.email, pepper);
    mockIdToDbId.set(user.userId, userId);
    ensureCommunityMember(db, communityId, userId, memberRoleForUser(user.email, index));

    if (user.profileComplete) {
      const profile: ProfileInput = {
        displayName: user.displayName,
        editionYear: user.editionYear,
        timezone: user.timezone,
        languages: user.languages as ProfileInput['languages'],
        originPlace: DEV_PLACES[user.originPlaceIndex] ?? DEV_PLACES[0]!,
        residencePlace: DEV_PLACES[user.residencePlaceIndex] ?? DEV_PLACES[2]!,
      };
      upsertMemberProfile(db, communityId, userId, profile);
    }
  });

  return mockIdToDbId;
}

function mapGroups(
  groups: GroupProposal[],
  mockIdToDbId: Map<string, string>,
): GroupProposal[] {
  return groups.map((group) => ({
    slot: group.slot,
    score: group.score,
    memberIds: group.memberIds.map((mockId) => {
      const dbId = mockIdToDbId.get(mockId);
      if (!dbId) {
        throw new Error(`Missing DB user for mock id ${mockId}`);
      }
      return dbId;
    }),
  }));
}

function insertRound(
  db: Database.Database,
  communityId: string,
  seed: (typeof DEV_ROUND_SEEDS)[number],
): void {
  const primaryQuestion = seed.questions[0] ?? '';
  db.prepare(
    `INSERT INTO rounds (
       id, community_id, status, theme, question, questions_json, slots_json, template_id, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    seed.id,
    communityId,
    seed.status,
    seed.theme,
    primaryQuestion,
    JSON.stringify(seed.questions),
    JSON.stringify(DEV_ROUND_SLOT_REFS),
    seed.templateId,
    seed.createdAt,
  );
}

export function seedDevPopulation(db: Database.Database): SeedDevPopulationResult {
  const pepper = requirePepper();

  db.prepare(
    `INSERT OR IGNORE INTO communities (id, name, slug, created_at)
     VALUES (?, 'GSA Piloto', 'gsa-pilot', datetime('now'))`,
  ).run(COMMUNITY_ID);

  const tx = db.transaction(() => {
    clearCommunityDemoData(db, COMMUNITY_ID);
    ensureExtendedSlotCalendars(db, COMMUNITY_ID);
    ensureTemplates(db, COMMUNITY_ID);
    const mockIdToDbId = seedUsers(db, COMMUNITY_ID, pepper);

    let declarationCount = 0;
    let circleCount = 0;
    let matchDraftCount = 0;

    const facilitatorDbId =
      mockIdToDbId.get('u-002') ??
      upsertUserByEmail(db, 'facilitador@demo.ember', pepper);

    for (const roundSeed of DEV_ROUND_SEEDS) {
      insertRound(db, COMMUNITY_ID, roundSeed);
      const declarations = buildRoundDeclarations(roundSeed);

      for (const declaration of declarations) {
        const dbUserId = mockIdToDbId.get(declaration.userId);
        if (!dbUserId) continue;

        upsertRoundDeclaration(db, roundSeed.id, dbUserId, {
          response: 'attending',
          slots: declaration.slots,
          intention: declaration.intention,
        });
        declarationCount += 1;
      }

      if (roundSeed.status === 'published' || roundSeed.withAutoMatchDraft) {
        const numericSeed = roundSeed.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const draft = buildMatchDraftFromDeclarations(
          declarations,
          roundSeed.templateId,
          numericSeed,
        );
        const groups = mapGroups(
          draft.trios.map((trio) => ({
            memberIds: [...trio.memberIds],
            slot: trio.slot,
            score: trio.score,
          })),
          mockIdToDbId,
        );

        if (roundSeed.status === 'published') {
          const circles = publishGroupsWithDelivery(
            db,
            roundSeed.id,
            groups,
            process.env.EMBER_JITSI_BASE_URL,
          );
          circleCount += circles.length;
        } else if (roundSeed.withAutoMatchDraft) {
          upsertMatchingRoundDraft(db, {
            roundId: roundSeed.id,
            groups,
            unmatchedMembers: draft.unmatchedMembers.map((item) => ({
              userId: mockIdToDbId.get(item.userId) ?? item.userId,
              reasons: [...item.reasons],
            })),
            triggeredBy: facilitatorDbId,
          });
          matchDraftCount += 1;
        }
      }
    }

    return {
      communityId: COMMUNITY_ID,
      users: DEV_USERS.length,
      templates: DEV_TEMPLATES.length,
      rounds: DEV_ROUND_SEEDS.length,
      declarations: declarationCount,
      circles: circleCount,
      matchDrafts: matchDraftCount,
    };
  });

  return tx();
}
