import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { PresenceInput } from '@ember/domain';

export type RoundRow = {
  id: string;
  community_id: string;
  status: string;
};

export function findOpenRound(db: Database.Database, communityId: string): RoundRow | null {
  return (
    (db
      .prepare(
        "SELECT id, community_id, status FROM rounds WHERE community_id = ? AND status = 'open' ORDER BY created_at DESC LIMIT 1",
      )
      .get(communityId) as RoundRow | undefined) ?? null
  );
}

export function findRoundById(db: Database.Database, roundId: string): RoundRow | null {
  return (
    (db.prepare('SELECT id, community_id, status FROM rounds WHERE id = ?').get(roundId) as
      | RoundRow
      | undefined) ?? null
  );
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
