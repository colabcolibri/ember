import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { TrioProposal } from '@ember/domain';
import { pairKey } from '@ember/domain';

export function loadMetPairs(db: Database.Database, communityId: string): Set<string> {
  const rows = db
    .prepare(
      `SELECT user_id, partner_user_id FROM meeting_participations WHERE community_id = ?`,
    )
    .all(communityId) as { user_id: string; partner_user_id: string }[];
  const pairs = new Set<string>();
  for (const row of rows) {
    pairs.add(pairKey(row.user_id, row.partner_user_id));
  }
  return pairs;
}

export type CircleRow = {
  id: string;
  round_id: string;
  status: string;
  scheduled_slot: string | null;
};

export function listCirclesForRound(db: Database.Database, roundId: string): CircleRow[] {
  return db
    .prepare(
      'SELECT id, round_id, status, scheduled_slot FROM circles WHERE round_id = ? ORDER BY created_at ASC',
    )
    .all(roundId) as CircleRow[];
}

export function listCircleMembers(
  db: Database.Database,
  circleId: string,
): { user_id: string; status: string }[] {
  return db
    .prepare('SELECT user_id, status FROM circle_members WHERE circle_id = ?')
    .all(circleId) as { user_id: string; status: string }[];
}

export function publishTrios(
  db: Database.Database,
  roundId: string,
  trios: TrioProposal[],
): CircleRow[] {
  const now = new Date().toISOString();
  const created: CircleRow[] = [];

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM circle_members WHERE circle_id IN (SELECT id FROM circles WHERE round_id = ?)').run(
      roundId,
    );
    db.prepare('DELETE FROM circles WHERE round_id = ?').run(roundId);

    for (const trio of trios) {
      const circleId = randomUUID();
      db.prepare(
        'INSERT INTO circles (id, round_id, status, scheduled_slot, created_at) VALUES (?, ?, ?, ?, ?)',
      ).run(circleId, roundId, 'invited', trio.slot, now);

      for (const userId of trio.memberIds) {
        db.prepare(
          'INSERT INTO circle_members (id, circle_id, user_id, status, created_at) VALUES (?, ?, ?, ?, ?)',
        ).run(randomUUID(), circleId, userId, 'invited', now);
      }

      created.push({
        id: circleId,
        round_id: roundId,
        status: 'invited',
        scheduled_slot: trio.slot,
      });
    }

    db.prepare("UPDATE rounds SET status = 'published' WHERE id = ?").run(roundId);
  });

  tx();
  return created;
}
