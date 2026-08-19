import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ensureDatabaseReady } from '@ember/db';
import {
  buildMagicLinkEmailContent,
  countSentEmailsByKind,
  createEmailSenderFromEnv,
  resetEmailSenderCacheForTests,
  sendTransactionalEmail,
} from './index.js';

describe('email providers', () => {
  beforeEach(() => {
    resetEmailSenderCacheForTests();
    delete process.env.EMBER_EMAIL_PROVIDER;
    delete process.env.RESEND_API_KEY;
  });

  it('defaults to noop provider', async () => {
    const sender = createEmailSenderFromEnv();
    const result = await sender.send({
      to: 'test@example.com',
      subject: 'Test',
      text: 'hello',
    });
    expect(result.ok).toBe(true);
    expect(result.provider).toBe('noop');
  });

  it('resend fails gracefully without API key', async () => {
    process.env.EMBER_EMAIL_PROVIDER = 'resend';
    const sender = createEmailSenderFromEnv();
    const result = await sender.send({
      to: 'test@example.com',
      subject: 'Test',
      text: 'hello',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('RESEND_API_KEY');
  });
});

describe('sent_emails persistence', () => {
  let dbPath: string;
  let db: ReturnType<typeof ensureDatabaseReady>;

  beforeEach(() => {
    resetEmailSenderCacheForTests();
    process.env.EMBER_EMAIL_PEPPER = 'test-pepper';
    process.env.EMBER_EMAIL_PROVIDER = 'noop';
    const dir = mkdtempSync(join(tmpdir(), 'ember-email-'));
    dbPath = join(dir, 'test.db');
    db = ensureDatabaseReady(dbPath);
  });

  afterEach(() => {
    db?.close();
    if (dbPath) {
      rmSync(join(dbPath, '..'), { recursive: true, force: true });
    }
  });

  it('records sent email only after successful send', async () => {
    const content = buildMagicLinkEmailContent({
      magicLinkUrl: 'http://localhost:3000/auth/magic?token=abc',
      ttlMinutes: 15,
    });

    const result = await sendTransactionalEmail({
      to: 'member@example.com',
      subject: content.subject,
      text: content.text,
      html: content.html,
      delivery: {
        db,
        pepper: 'test-pepper',
        kind: 'magic_link',
        meta: { locale: 'pt' },
      },
    });

    expect(result.ok).toBe(true);
    expect(countSentEmailsByKind(db, 'magic_link')).toBe(1);
  });

  it('does not record when send fails', async () => {
    process.env.EMBER_EMAIL_PROVIDER = 'resend';
    resetEmailSenderCacheForTests();

    const content = buildMagicLinkEmailContent({
      magicLinkUrl: 'http://localhost:3000/auth/magic?token=abc',
      ttlMinutes: 15,
    });

    const result = await sendTransactionalEmail({
      to: 'member@example.com',
      subject: content.subject,
      text: content.text,
      html: content.html,
      delivery: {
        db,
        pepper: 'test-pepper',
        kind: 'magic_link',
      },
    });

    expect(result.ok).toBe(false);
    expect(countSentEmailsByKind(db, 'magic_link')).toBe(0);
  });
});

describe('magic link template', () => {
  it('includes expiry and rust brand colors', () => {
    const content = buildMagicLinkEmailContent({
      magicLinkUrl: 'http://localhost:3000/auth/magic?token=secret',
      ttlMinutes: 30,
    });
    expect(content.subject).toContain('Ember');
    expect(content.text).toContain('30');
    expect(content.html).toContain('#aa4f36');
    expect(content.html).toContain('secret');
  });
});
