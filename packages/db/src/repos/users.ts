import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import {
  encryptRecipientEmail,
  hashRecipientEmail,
  normalizeRecipientEmail,
} from '../crypto/recipient-email-vault.js';

export function findUserByEmailHash(
  db: Database.Database,
  emailHash: string,
): { id: string } | null {
  return (
    (db.prepare('SELECT id FROM users WHERE email_hash = ?').get(emailHash) as
      | { id: string }
      | undefined) ?? null
  );
}

export function upsertUserByEmail(
  db: Database.Database,
  email: string,
  pepper: string,
): string {
  const normalized = normalizeRecipientEmail(email);
  const emailHash = hashRecipientEmail(normalized, pepper);
  const existing = findUserByEmailHash(db, emailHash);
  if (existing) {
    return existing.id;
  }
  const id = randomUUID();
  const emailVault = encryptRecipientEmail(normalized, pepper);
  db.prepare(
    'INSERT INTO users (id, email_hash, email_vault, created_at) VALUES (?, ?, ?, ?)',
  ).run(id, emailHash, emailVault, new Date().toISOString());
  return id;
}

export function ensureCommunityMember(
  db: Database.Database,
  communityId: string,
  userId: string,
  role = 'member',
): void {
  const existing = db
    .prepare('SELECT id FROM community_members WHERE community_id = ? AND user_id = ?')
    .get(communityId, userId) as { id: string } | undefined;
  if (existing) return;
  db.prepare(
    'INSERT INTO community_members (id, community_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(randomUUID(), communityId, userId, role, new Date().toISOString());
}
