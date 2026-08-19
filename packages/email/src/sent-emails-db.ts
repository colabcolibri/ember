import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import { decryptRecipientEmail } from './crypto/recipient-email-vault.js';
import { decryptSentEmailHtml, decryptSentEmailText } from './sent-email-body-vault.js';

export type SentEmailRow = {
  id: string;
  email_hash: string;
  email_vault: string | null;
  kind: string;
  subject: string;
  provider: string;
  meta_json: string | null;
  html_vault: string | null;
  text_vault: string | null;
  sent_at: string;
};

export type ListedSentEmail = {
  id: string;
  email: string | null;
  email_hash: string;
  kind: string;
  subject: string;
  provider: string;
  meta: Record<string, string> | null;
  has_body: boolean;
  sent_at: string;
};

export type SentEmailDetail = ListedSentEmail & {
  html: string | null;
  text: string | null;
};

export function insertSentEmail(
  db: Database.Database,
  input: Omit<SentEmailRow, 'id'> & { id?: string },
): string {
  const id = input.id ?? randomUUID();
  db.prepare(
    `INSERT INTO sent_emails (
      id, email_hash, email_vault, kind, subject, provider, meta_json, html_vault, text_vault, sent_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.email_hash,
    input.email_vault,
    input.kind,
    input.subject,
    input.provider,
    input.meta_json,
    input.html_vault,
    input.text_vault,
    input.sent_at,
  );
  return id;
}

function mapListedRow(row: SentEmailRow, pepper: string): ListedSentEmail {
  return {
    id: row.id,
    email: row.email_vault ? decryptRecipientEmail(row.email_vault, pepper) : null,
    email_hash: row.email_hash,
    kind: row.kind,
    subject: row.subject,
    provider: row.provider,
    meta: row.meta_json ? (JSON.parse(row.meta_json) as Record<string, string>) : null,
    has_body: Boolean(row.html_vault && row.text_vault),
    sent_at: row.sent_at,
  };
}

const SENT_EMAIL_SELECT = `SELECT id, email_hash, email_vault, kind, subject, provider, meta_json, html_vault, text_vault, sent_at`;

export function listSentEmails(
  db: Database.Database,
  pepper: string,
  limit = 200,
): ListedSentEmail[] {
  const safeLimit = Math.min(Math.max(limit, 1), 500);
  const rows = db
    .prepare(
      `${SENT_EMAIL_SELECT}
       FROM sent_emails
       ORDER BY sent_at DESC
       LIMIT ?`,
    )
    .all(safeLimit) as SentEmailRow[];

  return rows.map((row) => mapListedRow(row, pepper));
}

export function getSentEmailById(
  db: Database.Database,
  pepper: string,
  id: string,
): SentEmailDetail | null {
  const row = db.prepare(`${SENT_EMAIL_SELECT} FROM sent_emails WHERE id = ?`).get(id) as
    | SentEmailRow
    | undefined;

  if (!row) return null;

  const listed = mapListedRow(row, pepper);
  return {
    ...listed,
    html: row.html_vault ? decryptSentEmailHtml(row.html_vault, pepper) : null,
    text: row.text_vault ? decryptSentEmailText(row.text_vault, pepper) : null,
  };
}

export function countSentEmailsByKind(db: Database.Database, kind: string): number {
  const row = db.prepare('SELECT COUNT(*) as c FROM sent_emails WHERE kind = ?').get(kind) as {
    c: number;
  };
  return row.c;
}
