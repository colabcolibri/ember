import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';

export type MatchingAuditAction = 'auto_match' | 'undo_auto_match' | 'publish';

export type MatchingAuditEvent = {
  id: string;
  roundId: string;
  actorUserId: string;
  action: MatchingAuditAction;
  payload: Record<string, unknown>;
  createdAt: string;
};

export function insertMatchingAuditEvent(
  db: Database.Database,
  input: {
    roundId: string;
    actorUserId: string;
    action: MatchingAuditAction;
    payload: Record<string, unknown>;
  },
): MatchingAuditEvent {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO matching_audit_events (id, round_id, actor_user_id, action, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, input.roundId, input.actorUserId, input.action, JSON.stringify(input.payload), createdAt);

  return {
    id,
    roundId: input.roundId,
    actorUserId: input.actorUserId,
    action: input.action,
    payload: input.payload,
    createdAt,
  };
}

export function listMatchingAuditEvents(
  db: Database.Database,
  roundId: string,
  limit = 20,
): MatchingAuditEvent[] {
  const rows = db
    .prepare(
      `SELECT id, round_id, actor_user_id, action, payload_json, created_at
       FROM matching_audit_events
       WHERE round_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .all(roundId, limit) as {
    id: string;
    round_id: string;
    actor_user_id: string;
    action: string;
    payload_json: string;
    created_at: string;
  }[];

  return rows.map((row) => ({
    id: row.id,
    roundId: row.round_id,
    actorUserId: row.actor_user_id,
    action: row.action as MatchingAuditAction,
    payload: JSON.parse(row.payload_json) as Record<string, unknown>,
    createdAt: row.created_at,
  }));
}
