import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { CreateRoundInput, MatchingMember, PresenceInput } from '@ember/domain';
import { decryptRecipientEmail } from '../crypto/recipient-email-vault.js';

export type RoundRow = {
  id: string;
  community_id: string;
  status: string;
};

export type RoundDetailRow = RoundRow & {
  question: string | null;
  slots_json: string | null;
  template_id: string | null;
};

export function findOpenRound(db: Database.Database, communityId: string): RoundDetailRow | null {
  return (
    (db
      .prepare(
        `SELECT id, community_id, status, question, slots_json, template_id
         FROM rounds WHERE community_id = ? AND status = 'open' ORDER BY created_at DESC LIMIT 1`,
      )
      .get(communityId) as RoundDetailRow | undefined) ?? null
  );
}

export function findRoundById(db: Database.Database, roundId: string): RoundDetailRow | null {
  return (
    (db
      .prepare(
        'SELECT id, community_id, status, question, slots_json, template_id FROM rounds WHERE id = ?',
      )
      .get(roundId) as RoundDetailRow | undefined) ?? null
  );
}

export function closeOpenRoundsInCommunity(db: Database.Database, communityId: string): void {
  db.prepare("UPDATE rounds SET status = 'closed' WHERE community_id = ? AND status = 'open'").run(
    communityId,
  );
}

export function createMatchingRound(
  db: Database.Database,
  communityId: string,
  input: CreateRoundInput,
  templateId: string,
): RoundDetailRow {
  closeOpenRoundsInCommunity(db, communityId);
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO rounds (id, community_id, status, question, slots_json, template_id, created_at)
     VALUES (?, ?, 'open', ?, ?, ?, ?)`,
  ).run(id, communityId, input.question, JSON.stringify(input.slots), templateId, now);
  return findRoundById(db, id)!;
}

export type DeclarationListItem = {
  userId: string;
  memberLabel: string;
  emailMasked: string;
  slots: string[];
  intention: string;
  languages: string[];
  timezone: string | null;
};

export function listRoundDeclarations(
  db: Database.Database,
  roundId: string,
  page: number,
  limit: number,
  pepper: string,
): { items: DeclarationListItem[]; total: number } {
  const totalRow = db
    .prepare('SELECT COUNT(*) as c FROM round_declarations WHERE round_id = ?')
    .get(roundId) as { c: number };
  const offset = (page - 1) * limit;
  const rows = db
    .prepare(
      `SELECT rd.user_id, rd.slots_json, rd.intention, mp.display_name, mp.languages_json, mp.timezone, u.email_vault
       FROM round_declarations rd
       JOIN users u ON u.id = rd.user_id
       LEFT JOIN member_profiles mp ON mp.user_id = rd.user_id
       WHERE rd.round_id = ?
       ORDER BY rd.created_at ASC
       LIMIT ? OFFSET ?`,
    )
    .all(roundId, limit, offset) as {
    user_id: string;
    slots_json: string;
    intention: string;
    display_name: string | null;
    languages_json: string | null;
    timezone: string | null;
    email_vault: string | null;
  }[];

  const items = rows.map((row) => {
    const email = row.email_vault ? decryptRecipientEmail(row.email_vault, pepper) : null;
    const emailMasked = maskEmail(email ?? 'unknown');
    const displayName = row.display_name?.trim();
    return {
      userId: row.user_id,
      memberLabel: displayName || emailMasked,
      emailMasked,
      slots: JSON.parse(row.slots_json) as string[],
      intention: row.intention,
      languages: row.languages_json ? (JSON.parse(row.languages_json) as string[]) : [],
      timezone: row.timezone,
    };
  });

  return { items, total: totalRow.c };
}

export function loadMatchingMembers(
  db: Database.Database,
  communityId: string,
  roundId: string,
): MatchingMember[] {
  const rows = db
    .prepare(
      `SELECT rd.user_id, rd.slots_json, rd.intention, mp.languages_json
       FROM round_declarations rd
       LEFT JOIN member_profiles mp ON mp.user_id = rd.user_id AND mp.community_id = ?
       WHERE rd.round_id = ?`,
    )
    .all(communityId, roundId) as {
    user_id: string;
    slots_json: string;
    intention: string;
    languages_json: string | null;
  }[];

  return rows.map((row) => ({
    userId: row.user_id,
    slots: JSON.parse(row.slots_json) as MatchingMember['slots'],
    intention: row.intention as MatchingMember['intention'],
    languages: row.languages_json
      ? (JSON.parse(row.languages_json) as MatchingMember['languages'])
      : [],
  }));
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.length <= 1 ? '*' : `${local[0]}***`;
  return `${visible}@${domain}`;
}

export type RoundDeclarationRow = {
  round_id: string;
  user_id: string;
  slots_json: string;
  intention: string;
};

export function upsertRoundDeclaration(
  db: Database.Database,
  roundId: string,
  userId: string,
  input: PresenceInput,
): RoundDeclarationRow {
  const slotsJson = JSON.stringify(input.slots);
  const now = new Date().toISOString();
  const existing = db
    .prepare('SELECT round_id FROM round_declarations WHERE round_id = ? AND user_id = ?')
    .get(roundId, userId) as { round_id: string } | undefined;

  if (existing) {
    db.prepare(
      'UPDATE round_declarations SET slots_json = ?, intention = ?, created_at = ? WHERE round_id = ? AND user_id = ?',
    ).run(slotsJson, input.intention, now, roundId, userId);
  } else {
    db.prepare(
      'INSERT INTO round_declarations (id, round_id, user_id, slots_json, intention, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(randomUUID(), roundId, userId, slotsJson, input.intention, now);
  }

  return db
    .prepare(
      'SELECT round_id, user_id, slots_json, intention FROM round_declarations WHERE round_id = ? AND user_id = ?',
    )
    .get(roundId, userId) as RoundDeclarationRow;
}

export function getRoundDeclaration(
  db: Database.Database,
  roundId: string,
  userId: string,
): RoundDeclarationRow | null {
  return (
    (db
      .prepare(
        'SELECT round_id, user_id, slots_json, intention FROM round_declarations WHERE round_id = ? AND user_id = ?',
      )
      .get(roundId, userId) as RoundDeclarationRow | undefined) ?? null
  );
}
