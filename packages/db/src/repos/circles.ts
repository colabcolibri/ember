import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import {
  buildIcsEvent,
  buildJitsiRoomUrl,
  type GroupProposal,
} from '@ember/domain';
import { decryptRecipientEmail } from '../crypto/recipient-email-vault.js';
import { resolveScheduledAtForSlot } from './slot-calendars.js';
import { findRoundById } from './rounds.js';

export type CircleDetailRow = {
  id: string;
  round_id: string;
  status: string;
  scheduled_slot: string | null;
  scheduled_at: string | null;
  jitsi_url: string | null;
  question: string | null;
  community_id: string;
  community_name: string;
  duration_minutes: number;
};

export type CircleMemberDetail = {
  userId: string;
  emailMasked: string;
  status: string;
  attendance: string | null;
};

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.length <= 1 ? '*' : `${local[0]}***`;
  return `${visible}@${domain}`;
}

export function listMemberCircles(
  db: Database.Database,
  communityId: string,
  userId: string,
): CircleDetailRow[] {
  return db
    .prepare(
      `SELECT c.id, c.round_id, c.status, c.scheduled_slot, c.scheduled_at, c.jitsi_url,
              r.question, r.community_id, com.name as community_name, mt.duration_minutes
       FROM circles c
       JOIN circle_members cm ON cm.circle_id = c.id
       JOIN rounds r ON r.id = c.round_id
       JOIN communities com ON com.id = r.community_id
       LEFT JOIN meeting_templates mt ON mt.id = r.template_id
       WHERE cm.user_id = ? AND r.community_id = ?
       ORDER BY c.scheduled_at ASC`,
    )
    .all(userId, communityId) as CircleDetailRow[];
}

export function getCircleForMember(
  db: Database.Database,
  circleId: string,
  userId: string,
): CircleDetailRow | null {
  return (
    (db
      .prepare(
        `SELECT c.id, c.round_id, c.status, c.scheduled_slot, c.scheduled_at, c.jitsi_url,
                r.question, r.community_id, com.name as community_name, mt.duration_minutes
         FROM circles c
         JOIN circle_members cm ON cm.circle_id = c.id
         JOIN rounds r ON r.id = c.round_id
         JOIN communities com ON com.id = r.community_id
         LEFT JOIN meeting_templates mt ON mt.id = r.template_id
         WHERE c.id = ? AND cm.user_id = ?`,
      )
      .get(circleId, userId) as CircleDetailRow | undefined) ?? null
  );
}

export function listCircleMemberDetails(
  db: Database.Database,
  circleId: string,
  pepper: string,
): CircleMemberDetail[] {
  const rows = db
    .prepare(
      `SELECT cm.user_id, cm.status, cm.attendance, u.email_vault
       FROM circle_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.circle_id = ?
       ORDER BY cm.created_at ASC`,
    )
    .all(circleId) as {
    user_id: string;
    status: string;
    attendance: string | null;
    email_vault: string | null;
  }[];

  return rows.map((row) => {
    const email = row.email_vault ? decryptRecipientEmail(row.email_vault, pepper) : null;
    return {
      userId: row.user_id,
      emailMasked: maskEmail(email ?? 'membro'),
      status: row.status,
      attendance: row.attendance,
    };
  });
}

export function updateCircleMemberStatus(
  db: Database.Database,
  circleId: string,
  userId: string,
  status: 'confirmed' | 'declined',
): void {
  db.prepare('UPDATE circle_members SET status = ? WHERE circle_id = ? AND user_id = ?').run(
    status,
    circleId,
    userId,
  );
}

export function recordCircleAttendance(
  db: Database.Database,
  circleId: string,
  userId: string,
  happened: boolean,
): void {
  const value = happened ? 'yes' : 'no';
  db.prepare(
    'UPDATE circle_members SET attendance = ?, attendance_at = ? WHERE circle_id = ? AND user_id = ?',
  ).run(value, new Date().toISOString(), circleId, userId);
}

export function countAttendanceResponses(
  db: Database.Database,
  circleId: string,
): { yes: number; no: number; total: number } {
  const rows = db
    .prepare('SELECT attendance FROM circle_members WHERE circle_id = ?')
    .all(circleId) as { attendance: string | null }[];
  const yes = rows.filter((r) => r.attendance === 'yes').length;
  const no = rows.filter((r) => r.attendance === 'no').length;
  return { yes, no, total: rows.length };
}

export function persistCircleParticipations(
  db: Database.Database,
  communityId: string,
  circleId: string,
  metAt: string,
): number {
  const members = db
    .prepare('SELECT user_id FROM circle_members WHERE circle_id = ? AND attendance = ?')
    .all(circleId, 'yes') as { user_id: string }[];
  if (members.length < 2) return 0;

  let inserted = 0;
  const tx = db.transaction(() => {
    for (let i = 0; i < members.length; i += 1) {
      for (let j = i + 1; j < members.length; j += 1) {
        const userId = members[i]!.user_id;
        const partnerId = members[j]!.user_id;
        const exists = db
          .prepare(
            `SELECT id FROM meeting_participations
             WHERE community_id = ? AND circle_id = ? AND user_id = ? AND partner_user_id = ?`,
          )
          .get(communityId, circleId, userId, partnerId);
        if (exists) continue;
        db.prepare(
          `INSERT INTO meeting_participations (id, community_id, circle_id, user_id, partner_user_id, met_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        ).run(randomUUID(), communityId, circleId, userId, partnerId, metAt);
        inserted += 1;
      }
    }
    db.prepare("UPDATE circles SET status = 'completed' WHERE id = ?").run(circleId);
  });
  tx();
  return inserted;
}

export function buildCircleIcs(
  circle: CircleDetailRow,
  durationMinutes: number,
): string | null {
  if (!circle.scheduled_at || !circle.jitsi_url) return null;
  const start = new Date(circle.scheduled_at);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return buildIcsEvent({
    uid: `${circle.id}@ember`,
    title: `Ember — ${circle.community_name}`,
    description: circle.question ?? 'Fogo de Conselho',
    location: circle.jitsi_url,
    start,
    end,
    url: circle.jitsi_url,
  });
}

export function enrichPublishedCircle(
  db: Database.Database,
  circleId: string,
  slot: string,
  jitsiBaseUrl?: string,
): void {
  const scheduledAt = resolveScheduledAtForSlot(db, slot, new Date());
  const jitsiUrl = buildJitsiRoomUrl(circleId, jitsiBaseUrl);
  db.prepare('UPDATE circles SET jitsi_url = ?, scheduled_at = ? WHERE id = ?').run(
    jitsiUrl,
    scheduledAt,
    circleId,
  );
}

export function listCommunityMemberEmails(
  db: Database.Database,
  communityId: string,
  pepper: string,
): { userId: string; email: string }[] {
  const rows = db
    .prepare(
      `SELECT cm.user_id, u.email_vault
       FROM community_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.community_id = ?`,
    )
    .all(communityId) as { user_id: string; email_vault: string | null }[];

  const result: { userId: string; email: string }[] = [];
  for (const row of rows) {
    const email = row.email_vault ? decryptRecipientEmail(row.email_vault, pepper) : null;
    if (email) result.push({ userId: row.user_id, email });
  }
  return result;
}

export type PublishCircleRow = {
  id: string;
  round_id: string;
  status: string;
  scheduled_slot: string | null;
  scheduled_at: string | null;
  jitsi_url: string | null;
};

export function publishGroupsWithDelivery(
  db: Database.Database,
  roundId: string,
  groups: GroupProposal[],
  jitsiBaseUrl?: string,
): PublishCircleRow[] {
  const now = new Date().toISOString();
  const created: PublishCircleRow[] = [];
  const round = findRoundById(db, roundId);
  const slotsJson = round?.slots_json ?? null;

  const tx = db.transaction(() => {
    db.prepare(
      'DELETE FROM circle_members WHERE circle_id IN (SELECT id FROM circles WHERE round_id = ?)',
    ).run(roundId);
    db.prepare('DELETE FROM circles WHERE round_id = ?').run(roundId);

    for (const group of groups) {
      const circleId = randomUUID();
      const scheduledAt = resolveScheduledAtForSlot(db, group.slot, new Date(), slotsJson);
      const jitsiUrl = buildJitsiRoomUrl(circleId, jitsiBaseUrl);
      db.prepare(
        `INSERT INTO circles (id, round_id, status, scheduled_slot, scheduled_at, jitsi_url, created_at)
         VALUES (?, ?, 'invited', ?, ?, ?, ?)`,
      ).run(circleId, roundId, group.slot, scheduledAt, jitsiUrl, now);

      for (const userId of group.memberIds) {
        db.prepare(
          'INSERT INTO circle_members (id, circle_id, user_id, status, created_at) VALUES (?, ?, ?, ?, ?)',
        ).run(randomUUID(), circleId, userId, 'invited', now);
      }

      created.push({
        id: circleId,
        round_id: roundId,
        status: 'invited',
        scheduled_slot: group.slot,
        scheduled_at: scheduledAt,
        jitsi_url: jitsiUrl,
      });
    }

    db.prepare("UPDATE rounds SET status = 'published' WHERE id = ?").run(roundId);
  });

  tx();
  return created;
}

/** @deprecated use publishGroupsWithDelivery */
export function publishTriosWithDelivery(
  db: Database.Database,
  roundId: string,
  trios: GroupProposal[],
  jitsiBaseUrl?: string,
): PublishCircleRow[] {
  return publishGroupsWithDelivery(db, roundId, trios, jitsiBaseUrl);
}
