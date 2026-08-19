import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { MeetingTemplateInput } from '@ember/domain';

export type MeetingTemplateRow = {
  id: string;
  community_id: string;
  name: string;
  circle_size: number;
  duration_minutes: number;
};

export function listMeetingTemplates(
  db: Database.Database,
  communityId: string,
): MeetingTemplateRow[] {
  return db
    .prepare(
      `SELECT id, community_id, name, circle_size, duration_minutes
       FROM meeting_templates
       WHERE community_id = ?
       ORDER BY created_at ASC`,
    )
    .all(communityId) as MeetingTemplateRow[];
}

export function createMeetingTemplate(
  db: Database.Database,
  communityId: string,
  input: MeetingTemplateInput,
): MeetingTemplateRow {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO meeting_templates (id, community_id, name, circle_size, duration_minutes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, communityId, input.name, input.circleSize, input.durationMinutes, now);
  return findTemplateById(db, id)!;
}

export function findTemplateById(
  db: Database.Database,
  templateId: string,
): MeetingTemplateRow | null {
  return (
    (db
      .prepare(
        'SELECT id, community_id, name, circle_size, duration_minutes FROM meeting_templates WHERE id = ?',
      )
      .get(templateId) as MeetingTemplateRow | undefined) ?? null
  );
}

export function findDefaultTemplateForCommunity(
  db: Database.Database,
  communityId: string,
): MeetingTemplateRow | null {
  return (
    (db
      .prepare(
        'SELECT id, community_id, name, circle_size, duration_minutes FROM meeting_templates WHERE community_id = ? ORDER BY created_at ASC LIMIT 1',
      )
      .get(communityId) as MeetingTemplateRow | undefined) ?? null
  );
}

export function updateMeetingTemplate(
  db: Database.Database,
  templateId: string,
  input: MeetingTemplateInput,
): MeetingTemplateRow | null {
  db.prepare(
    'UPDATE meeting_templates SET name = ?, circle_size = ?, duration_minutes = ? WHERE id = ?',
  ).run(input.name, input.circleSize, input.durationMinutes, templateId);
  return findTemplateById(db, templateId);
}
