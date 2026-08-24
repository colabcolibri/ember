import type Database from 'better-sqlite3';
import type { GroupProposal, UnmatchedMember } from '@ember/domain';

export type MatchingRoundDraft = {
  roundId: string;
  groups: GroupProposal[];
  /** @deprecated use groups */
  trios: GroupProposal[];
  unmatchedMembers: UnmatchedMember[];
  triggeredBy: string;
  createdAt: string;
};

export function findMatchingRoundDraft(
  db: Database.Database,
  roundId: string,
): MatchingRoundDraft | null {
  const row = db
    .prepare(
      `SELECT round_id, trios_json, unmatched_json, triggered_by, created_at
       FROM matching_round_drafts WHERE round_id = ?`,
    )
    .get(roundId) as
    | {
        round_id: string;
        trios_json: string;
        unmatched_json: string;
        triggered_by: string;
        created_at: string;
      }
    | undefined;

  if (!row) return null;

  const groups = JSON.parse(row.trios_json) as GroupProposal[];

  return {
    roundId: row.round_id,
    groups,
    trios: groups,
    unmatchedMembers: JSON.parse(row.unmatched_json) as UnmatchedMember[],
    triggeredBy: row.triggered_by,
    createdAt: row.created_at,
  };
}

export function upsertMatchingRoundDraft(
  db: Database.Database,
  input: {
    roundId: string;
    groups: GroupProposal[];
    unmatchedMembers: UnmatchedMember[];
    triggeredBy: string;
  },
): MatchingRoundDraft {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO matching_round_drafts (round_id, trios_json, unmatched_json, triggered_by, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(round_id) DO UPDATE SET
       trios_json = excluded.trios_json,
       unmatched_json = excluded.unmatched_json,
       triggered_by = excluded.triggered_by,
       created_at = excluded.created_at`,
  ).run(
    input.roundId,
    JSON.stringify(input.groups),
    JSON.stringify(input.unmatchedMembers),
    input.triggeredBy,
    now,
  );

  return {
    roundId: input.roundId,
    groups: input.groups,
    trios: input.groups,
    unmatchedMembers: input.unmatchedMembers,
    triggeredBy: input.triggeredBy,
    createdAt: now,
  };
}

export function deleteMatchingRoundDraft(db: Database.Database, roundId: string): boolean {
  const result = db.prepare('DELETE FROM matching_round_drafts WHERE round_id = ?').run(roundId);
  return result.changes > 0;
}
