import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { PublishCircleRow } from './circles.js';

export type CircleReminderKind = '24h' | '15min';

export type CircleReminderJob = {
  id: string;
  circleId: string;
  userId: string;
  kind: CircleReminderKind;
  runAt: string;
  status: 'pending' | 'sent' | 'skipped' | 'failed';
  createdAt: string;
  sentAt: string | null;
};

function reminderRunAt(scheduledAt: string, kind: CircleReminderKind): string {
  const at = new Date(scheduledAt);
  const offsetMs = kind === '24h' ? 24 * 60 * 60 * 1000 : 15 * 60 * 1000;
  return new Date(at.getTime() - offsetMs).toISOString();
}

export function scheduleCircleReminderJobs(
  db: Database.Database,
  circles: PublishCircleRow[],
): number {
  const now = new Date().toISOString();
  let created = 0;

  const insert = db.prepare(
    `INSERT OR IGNORE INTO circle_reminder_jobs
     (id, circle_id, user_id, kind, run_at, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
  );

  for (const circle of circles) {
    if (!circle.scheduled_at) continue;
    const members = db
      .prepare('SELECT user_id FROM circle_members WHERE circle_id = ?')
      .all(circle.id) as { user_id: string }[];

    for (const member of members) {
      for (const kind of ['24h', '15min'] as const) {
        const runAt = reminderRunAt(circle.scheduled_at, kind);
        const result = insert.run(
          randomUUID(),
          circle.id,
          member.user_id,
          kind,
          runAt,
          now,
        );
        created += result.changes;
      }
    }
  }

  return created;
}

export function listDueCircleReminderJobs(
  db: Database.Database,
  limit = 50,
): CircleReminderJob[] {
  const now = new Date().toISOString();
  const rows = db
    .prepare(
      `SELECT id, circle_id, user_id, kind, run_at, status, created_at, sent_at
       FROM circle_reminder_jobs
       WHERE status = 'pending' AND run_at <= ?
       ORDER BY run_at ASC
       LIMIT ?`,
    )
    .all(now, limit) as {
    id: string;
    circle_id: string;
    user_id: string;
    kind: CircleReminderKind;
    run_at: string;
    status: CircleReminderJob['status'];
    created_at: string;
    sent_at: string | null;
  }[];

  return rows.map((row) => ({
    id: row.id,
    circleId: row.circle_id,
    userId: row.user_id,
    kind: row.kind,
    runAt: row.run_at,
    status: row.status,
    createdAt: row.created_at,
    sentAt: row.sent_at,
  }));
}

export function markCircleReminderJob(
  db: Database.Database,
  jobId: string,
  status: Exclude<CircleReminderJob['status'], 'pending'>,
): void {
  const sentAt = status === 'sent' ? new Date().toISOString() : null;
  db.prepare('UPDATE circle_reminder_jobs SET status = ?, sent_at = ? WHERE id = ?').run(
    status,
    sentAt,
    jobId,
  );
}

export function shouldSkipCircleReminder(
  db: Database.Database,
  circleId: string,
  userId: string,
): boolean {
  const circle = db
    .prepare('SELECT status FROM circles WHERE id = ?')
    .get(circleId) as { status: string } | undefined;
  if (!circle || circle.status === 'cancelled') return true;

  const member = db
    .prepare('SELECT status FROM circle_members WHERE circle_id = ? AND user_id = ?')
    .get(circleId, userId) as { status: string } | undefined;
  return !member || member.status === 'declined';
}

export function hasSentReminder(
  db: Database.Database,
  circleId: string,
  userId: string,
  kind: CircleReminderKind,
): boolean {
  const row = db
    .prepare(
      `SELECT id FROM sent_emails
       WHERE kind = 'circle_reminder'
         AND json_extract(meta_json, '$.circle_id') = ?
         AND json_extract(meta_json, '$.user_id') = ?
         AND json_extract(meta_json, '$.reminder_kind') = ?`,
    )
    .get(circleId, userId, kind) as { id: string } | undefined;
  return Boolean(row);
}
