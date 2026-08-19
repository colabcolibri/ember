import type Database from 'better-sqlite3';
import {
  encryptRecipientEmail,
  hashRecipientEmail,
  normalizeRecipientEmail,
} from './crypto/recipient-email-vault.js';
import { redactSentEmailBody } from './redact-sent-email-body.js';
import { encryptSentEmailHtml, encryptSentEmailText } from './sent-email-body-vault.js';
import { insertSentEmail } from './sent-emails-db.js';

export type SentEmailRecordInput = {
  email: string;
  pepper: string;
  kind: string;
  subject: string;
  provider: string;
  html?: string | null;
  text?: string | null;
  meta?: Record<string, string>;
};

export function recordSentEmail(db: Database.Database, input: SentEmailRecordInput): string {
  const normalized = normalizeRecipientEmail(input.email);
  const emailHash = hashRecipientEmail(normalized, input.pepper);
  const emailVault = encryptRecipientEmail(normalized, input.pepper);
  const metaJson =
    input.meta && Object.keys(input.meta).length > 0 ? JSON.stringify(input.meta) : null;

  let htmlVault: string | null = null;
  let textVault: string | null = null;
  const html = input.html?.trim();
  const text = input.text?.trim();
  if (html && text) {
    const redacted = redactSentEmailBody({ html, text });
    htmlVault = encryptSentEmailHtml(redacted.html, input.pepper);
    textVault = encryptSentEmailText(redacted.text, input.pepper);
  }

  return insertSentEmail(db, {
    email_hash: emailHash,
    email_vault: emailVault,
    kind: input.kind,
    subject: input.subject.slice(0, 500),
    provider: input.provider,
    meta_json: metaJson,
    html_vault: htmlVault,
    text_vault: textVault,
    sent_at: new Date().toISOString(),
  });
}
