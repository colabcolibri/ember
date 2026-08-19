import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ensureDatabaseReady } from '@ember/db';
import {
  buildCircleFormedEmailContent,
  buildLoginCodeEmailContent,
  buildMagicLinkEmailContent,
  buildMagicLinkUrl,
  buildRoundOpenEmailContent,
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
    const content = buildLoginCodeEmailContent({
      code: '123456',
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
        kind: 'login_code',
        meta: { locale: 'pt' },
      },
    });

    expect(result.ok).toBe(true);
    expect(countSentEmailsByKind(db, 'login_code')).toBe(1);
  });

  it('does not record when send fails', async () => {
    process.env.EMBER_EMAIL_PROVIDER = 'resend';
    resetEmailSenderCacheForTests();

    const content = buildLoginCodeEmailContent({
      code: '123456',
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
        kind: 'login_code',
      },
    });

    expect(result.ok).toBe(false);
    expect(countSentEmailsByKind(db, 'login_code')).toBe(0);
  });
});

describe('login code template', () => {
  it('includes code and expiry', () => {
    const content = buildLoginCodeEmailContent({
      code: '654321',
      ttlMinutes: 15,
      locale: 'pt',
    });
    expect(content.subject).toContain('Ember');
    expect(content.text).toContain('654321');
    expect(content.text).toContain('15');
    expect(content.html).toContain('654321');
    expect(content.html).toContain('#aa4f36');
  });
});

describe('magic link template (legacy)', () => {
  it('includes expiry and rust brand colors', () => {
    const magicLinkUrl = buildMagicLinkUrl({ token: 'secret' });
    const content = buildMagicLinkEmailContent({
      magicLinkUrl,
      ttlMinutes: 30,
    });
    expect(content.subject).toContain('Ember');
    expect(content.text).toContain('30');
    expect(content.html).toContain('#aa4f36');
    expect(content.html).toContain('magic-link/verify');
    expect(content.html).toContain('color-scheme');
  });
});

describe('round open template', () => {
  it('renders structured content with readable slot labels', () => {
    const content = buildRoundOpenEmailContent({
      theme: 'Encontro 001 - A gente é tudo junto',
      questions: [
        'Como você se vê em 10 anos?',
        'Quais medos mais te assombram?',
      ],
      slotLabels: [
        'seg., 24 de ago., 19:00 (America/Sao_Paulo)',
        'qua., 26 de ago., 19:00 (America/Sao_Paulo)',
      ],
      presenceUrl: 'https://ember.test/presence',
      locale: 'pt',
    });

    expect(content.text).toContain('Encontro 001');
    expect(content.text).toContain('1. Como você se vê em 10 anos?');
    expect(content.text).toContain('• seg., 24 de ago., 19:00');
    expect(content.text).not.toContain('dt:');
    expect(content.html).toContain('Horários disponíveis');
    expect(content.html).toContain('email-header-tagline');
    expect(content.html).toContain('#c9c4bc');
  });
});

describe('circle formed template', () => {
  it('renders structured sections', () => {
    const content = buildCircleFormedEmailContent({
      question: 'O que te move hoje?',
      whenLabel: 'seg. 24 ago 19:00 (America/Sao_Paulo)',
      jitsiUrl: 'https://meet.jit.si/ember-test',
      circleUrl: 'https://ember.test/circles/abc',
      locale: 'pt',
    });

    expect(content.text).toContain('Pergunta do encontro');
    expect(content.html).toContain('Seu círculo está pronto');
    expect(content.html).toContain('Entrar no Jitsi');
  });
});
