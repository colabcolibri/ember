import { createHash, randomInt, randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import {
  encryptRecipientEmail,
  hashRecipientEmail,
  normalizeRecipientEmail,
  decryptRecipientEmail,
} from '../crypto/recipient-email-vault.js';

const CODE_TTL_MINUTES = 15;

export function hashLoginCode(email: string, code: string, pepper: string): string {
  return createHash('sha256')
    .update(`${pepper}:${normalizeRecipientEmail(email)}:${code}`)
    .digest('hex');
}

/** @deprecated use hashLoginCode — mantido para testes legados */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createLoginCode(
  db: Database.Database,
  email: string,
  pepper: string,
): { code: string; expiresAt: string } {
  const code = String(randomInt(100000, 1000000));
  const normalized = normalizeRecipientEmail(email);
  const emailHash = hashRecipientEmail(normalized, pepper);
  const emailVault = encryptRecipientEmail(normalized, pepper);
  const codeHash = hashLoginCode(normalized, code, pepper);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

  db.prepare(
    'UPDATE auth_magic_tokens SET used_at = ? WHERE email_hash = ? AND used_at IS NULL',
  ).run(now, emailHash);

  db.prepare(
    `INSERT INTO auth_magic_tokens (id, token_hash, email_hash, email_vault, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), codeHash, emailHash, emailVault, expiresAt, now);

  return { code, expiresAt };
}

export type LoginCodeRow = {
  id: string;
  email_hash: string;
  email_vault: string | null;
  expires_at: string;
  used_at: string | null;
};

export function findValidLoginCode(
  db: Database.Database,
  email: string,
  code: string,
  pepper: string,
): LoginCodeRow | null {
  const normalized = normalizeRecipientEmail(email);
  const emailHash = hashRecipientEmail(normalized, pepper);
  const codeHash = hashLoginCode(normalized, code, pepper);
  const row = db
    .prepare(
      `SELECT id, email_hash, email_vault, expires_at, used_at
       FROM auth_magic_tokens WHERE email_hash = ? AND token_hash = ?`,
    )
    .get(emailHash, codeHash) as LoginCodeRow | undefined;
  if (!row || row.used_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return row;
}

export function resolveEmailFromLoginCode(row: LoginCodeRow, pepper: string): string | null {
  if (row.email_vault) {
    return decryptRecipientEmail(row.email_vault, pepper);
  }
  return null;
}

export function markLoginCodeUsed(db: Database.Database, id: string): void {
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
