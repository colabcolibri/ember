import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { CreateRoundInput, MatchingMember, PresenceInput, PresenceResponse } from '@ember/domain';
import { decryptRecipientEmail } from '../crypto/recipient-email-vault.js';

export type RoundRow = {
  id: string;
  community_id: string;
  status: string;
};

export type RoundDetailRow = RoundRow & {
  theme: string | null;
  question: string | null;
  questions_json: string | null;
  slots_json: string | null;
  template_id: string | null;
  created_by_user_id: string | null;
  created_at: string;
};

export type MatchingRoundListItem = {
  id: string;
  status: string;
  theme: string | null;
  question: string | null;
  questionsJson: string | null;
  slotsJson: string | null;
  templateId: string | null;
  templateName: string | null;
  circleSize: number | null;
  durationMinutes: number | null;
  createdAt: string;
  createdByUserId: string | null;
  createdByDisplayName: string | null;
  declarationCount: number;
  circleCount: number;
};

export function listMatchingRounds(
  db: Database.Database,
  communityId: string,
): MatchingRoundListItem[] {
  const rows = db
    .prepare(
      `SELECT r.id, r.status, r.theme, r.question, r.questions_json, r.slots_json, r.template_id, r.created_at,
              r.created_by_user_id,
              mp.display_name AS creator_display_name,
              mt.name AS template_name, mt.circle_size, mt.duration_minutes,
              (SELECT COUNT(*) FROM round_declarations rd WHERE rd.round_id = r.id AND rd.response = 'attending') AS declaration_count,
              (SELECT COUNT(*) FROM circles c WHERE c.round_id = r.id) AS circle_count
       FROM rounds r
       LEFT JOIN meeting_templates mt ON mt.id = r.template_id
       LEFT JOIN member_profiles mp
         ON mp.user_id = r.created_by_user_id AND mp.community_id = r.community_id
       WHERE r.community_id = ?
       ORDER BY r.created_at DESC`,
    )
    .all(communityId) as {
    id: string;
    status: string;
    theme: string | null;
    question: string | null;
    questions_json: string | null;
    slots_json: string | null;
    template_id: string | null;
    template_name: string | null;
    circle_size: number | null;
    duration_minutes: number | null;
    created_at: string;
    created_by_user_id: string | null;
    creator_display_name: string | null;
    declaration_count: number;
    circle_count: number;
  }[];

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    theme: row.theme,
    question: row.question,
    questionsJson: row.questions_json,
    slotsJson: row.slots_json,
    templateId: row.template_id,
    templateName: row.template_name,
    circleSize: row.circle_size,
    durationMinutes: row.duration_minutes,
    createdAt: row.created_at,
    createdByUserId: row.created_by_user_id,
    createdByDisplayName: row.creator_display_name,
    declarationCount: row.declaration_count,
    circleCount: row.circle_count,
  }));
}

export function listOpenRounds(db: Database.Database, communityId: string): RoundDetailRow[] {
  return db
    .prepare(
      `SELECT id, community_id, status, theme, question, questions_json, slots_json, template_id, created_by_user_id, created_at
       FROM rounds WHERE community_id = ? AND status = 'open' ORDER BY created_at DESC`,
    )
    .all(communityId) as RoundDetailRow[];
}

export function findOpenRound(db: Database.Database, communityId: string): RoundDetailRow | null {
  return (
    (db
      .prepare(
        `SELECT id, community_id, status, theme, question, questions_json, slots_json, template_id, created_by_user_id, created_at
         FROM rounds WHERE community_id = ? AND status = 'open' ORDER BY created_at DESC LIMIT 1`,
      )
      .get(communityId) as RoundDetailRow | undefined) ?? null
  );
}

export function findRoundById(db: Database.Database, roundId: string): RoundDetailRow | null {
  return (
    (db
      .prepare(
        'SELECT id, community_id, status, theme, question, questions_json, slots_json, template_id, created_by_user_id, created_at FROM rounds WHERE id = ?',
      )
      .get(roundId) as RoundDetailRow | undefined) ?? null
  );
}

export function closeOpenRoundsInCommunity(db: Database.Database, communityId: string): void {
  db.prepare("UPDATE rounds SET status = 'closed' WHERE community_id = ? AND status = 'open'").run(
    communityId,
  );
}

export function closeMatchingRound(db: Database.Database, roundId: string): RoundDetailRow | null {
  const round = findRoundById(db, roundId);
  if (!round || round.status !== 'open') return null;
  db.prepare("UPDATE rounds SET status = 'closed' WHERE id = ? AND status = 'open'").run(roundId);
  return findRoundById(db, roundId);
}

export type ReopenMatchingRoundResult =
  | { ok: true; round: RoundDetailRow }
  | { ok: false; code: 'NOT_CLOSED' };

export function reopenMatchingRound(
  db: Database.Database,
  communityId: string,
  roundId: string,
): ReopenMatchingRoundResult {
  const round = findRoundById(db, roundId);
  if (!round || round.community_id !== communityId || round.status !== 'closed') {
    return { ok: false, code: 'NOT_CLOSED' };
  }

  db.prepare("UPDATE rounds SET status = 'open' WHERE id = ? AND status = 'closed'").run(roundId);
  const reopened = findRoundById(db, roundId);
  if (!reopened) {
    return { ok: false, code: 'NOT_CLOSED' };
  }

  return { ok: true, round: reopened };
}

export function updateMatchingRound(
  db: Database.Database,
  roundId: string,
  input: CreateRoundInput,
): RoundDetailRow | null {
  const round = findRoundById(db, roundId);
  if (!round || round.status !== 'open') return null;
  const primaryQuestion = input.questions[0] ?? '';
  db.prepare(
    `UPDATE rounds
     SET theme = ?, question = ?, questions_json = ?, slots_json = ?
     WHERE id = ? AND status = 'open'`,
  ).run(
    input.theme,
    primaryQuestion,
    JSON.stringify(input.questions),
    JSON.stringify(input.slots),
    roundId,
  );
  return findRoundById(db, roundId);
}

export function createMatchingRound(
  db: Database.Database,
  communityId: string,
  input: CreateRoundInput,
  templateId: string,
  createdByUserId?: string | null,
): RoundDetailRow {
  const id = randomUUID();
  const now = new Date().toISOString();
  const primaryQuestion = input.questions[0] ?? '';
  const questionsJson = JSON.stringify(input.questions);
  db.prepare(
    `INSERT INTO rounds (id, community_id, status, theme, question, questions_json, slots_json, template_id, created_by_user_id, created_at)
     VALUES (?, ?, 'open', ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    communityId,
    input.theme,
    primaryQuestion,
    questionsJson,
    JSON.stringify(input.slots),
    templateId,
    createdByUserId ?? null,
    now,
  );
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
  response: PresenceResponse;
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
      `SELECT rd.user_id, rd.slots_json, rd.intention, rd.response, mp.display_name, mp.languages_json, mp.timezone, u.email_vault
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
    response: PresenceResponse;
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
      response: row.response ?? 'attending',
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
       WHERE rd.round_id = ? AND rd.response = 'attending'`,
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
  response: PresenceResponse;
};

export function upsertRoundDeclaration(
  db: Database.Database,
  roundId: string,
  userId: string,
  input: PresenceInput,
): RoundDeclarationRow {
  const response: PresenceResponse = input.response === 'declined' ? 'declined' : 'attending';
  let slotsJson = '[]';
  let intention = 'declined';

  if (response === 'attending') {
    if (!('slots' in input) || !('intention' in input)) {
      throw new Error('Invalid attending declaration');
    }
    slotsJson = JSON.stringify(input.slots);
    intention = input.intention;
  }
  const now = new Date().toISOString();
  const existing = db
    .prepare('SELECT round_id FROM round_declarations WHERE round_id = ? AND user_id = ?')
    .get(roundId, userId) as { round_id: string } | undefined;

  if (existing) {
    db.prepare(
      'UPDATE round_declarations SET slots_json = ?, intention = ?, response = ?, created_at = ? WHERE round_id = ? AND user_id = ?',
    ).run(slotsJson, intention, response, now, roundId, userId);
  } else {
    db.prepare(
      'INSERT INTO round_declarations (id, round_id, user_id, slots_json, intention, response, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(randomUUID(), roundId, userId, slotsJson, intention, response, now);
  }

  return db
    .prepare(
      'SELECT round_id, user_id, slots_json, intention, response FROM round_declarations WHERE round_id = ? AND user_id = ?',
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
        'SELECT round_id, user_id, slots_json, intention, response FROM round_declarations WHERE round_id = ? AND user_id = ?',
      )
      .get(roundId, userId) as RoundDeclarationRow | undefined) ?? null
  );
}
