import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import {
  encryptRecipientEmail,
  hashRecipientEmail,
  normalizeRecipientEmail,
  decryptRecipientEmail,
} from '../crypto/recipient-email-vault.js';

const TOKEN_TTL_MINUTES = 15;

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createMagicToken(
  db: Database.Database,
  email: string,
  pepper: string,
): { token: string; expiresAt: string } {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  const normalized = normalizeRecipientEmail(email);
  const emailHash = hashRecipientEmail(normalized, pepper);
  const emailVault = encryptRecipientEmail(normalized, pepper);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

  db.prepare(
    `INSERT INTO auth_magic_tokens (id, token_hash, email_hash, email_vault, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), tokenHash, emailHash, emailVault, expiresAt, new Date().toISOString());

  return { token, expiresAt };
}

export type MagicTokenRow = {
  id: string;
  email_hash: string;
  email_vault: string | null;
  expires_at: string;
  used_at: string | null;
};

export function findValidMagicToken(
  db: Database.Database,
  token: string,
): MagicTokenRow | null {
  const row = db
    .prepare(
      'SELECT id, email_hash, email_vault, expires_at, used_at FROM auth_magic_tokens WHERE token_hash = ?',
    )
    .get(hashToken(token)) as MagicTokenRow | undefined;
  if (!row || row.used_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return row;
}

export function resolveEmailFromMagicToken(row: MagicTokenRow, pepper: string): string | null {
  if (row.email_vault) {
    return decryptRecipientEmail(row.email_vault, pepper);
  }
  return null;
}

export function markMagicTokenUsed(db: Database.Database, id: string): void {
  db.prepare('UPDATE auth_magic_tokens SET used_at = ? WHERE id = ?').run(
    new Date().toISOString(),
    id,
  );
}

export function createSession(
  db: Database.Database,
  userId: string,
  ttlDays = 7,
): { sessionId: string; expiresAt: string } {
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    'INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
  ).run(sessionId, userId, expiresAt, new Date().toISOString());
  return { sessionId, expiresAt };
}

export type SessionRow = {
  id: string;
  user_id: string;
  expires_at: string;
};

export function findValidSession(db: Database.Database, sessionId: string): SessionRow | null {
  const row = db
    .prepare('SELECT id, user_id, expires_at FROM sessions WHERE id = ?')
    .get(sessionId) as SessionRow | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return row;
}
