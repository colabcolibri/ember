import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { createLoginCode, ensureDatabaseReady } from '@ember/db';
import { resetEmailSenderCacheForTests } from '@ember/email';
import { createAuthRoutes } from './auth.js';
import { resetRateLimitsForTests } from '../lib/rate-limit.js';
import { SESSION_COOKIE } from '../lib/session.js';

describe('auth routes', () => {
  let dbPath: string;
  let db: ReturnType<typeof ensureDatabaseReady>;
  let app: Hono;

  beforeEach(() => {
    resetEmailSenderCacheForTests();
    resetRateLimitsForTests();
    process.env.EMBER_EMAIL_PEPPER = 'test-pepper';
    process.env.EMBER_EMAIL_PROVIDER = 'noop';
    process.env.EMBER_DEFAULT_COMMUNITY_SLUG = 'gsa-pilot';
    const dir = mkdtempSync(join(tmpdir(), 'ember-api-auth-'));
    dbPath = join(dir, 'test.db');
    db = ensureDatabaseReady(dbPath);
    app = new Hono();
    app.route('/auth', createAuthRoutes(db));
  });

  afterEach(() => {
    db?.close();
    if (dbPath) {
      rmSync(join(dbPath, '..'), { recursive: true, force: true });
    }
  });

  it('returns 202 with generic message for code request', async () => {
    const res = await app.request('/auth/code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'member@example.com' }),
    });
    expect(res.status).toBe(202);
    const body = (await res.json()) as { message: string };
    expect(body.message).toContain('código');
  });

  it('returns same 202 for unknown email (anti-enumeration)', async () => {
    const res = await app.request('/auth/code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@example.com' }),
    });
    expect(res.status).toBe(202);
  });

  it('verifies code and sets session cookie', async () => {
    const pepper = 'test-pepper';
    const { code } = createLoginCode(db, 'member@example.com', pepper);

    const res = await app.request('/auth/code/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'member@example.com', code }),
    });
    expect(res.status).toBe(200);
    const cookie = res.headers.get('set-cookie');
    expect(cookie).toContain(SESSION_COOKIE);
  });

  it('rate limits code requests after 5 per hour', async () => {
    for (let i = 0; i < 5; i += 1) {
      const res = await app.request('/auth/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-real-ip': '1.2.3.4' },
        body: JSON.stringify({ email: `u${i}@example.com` }),
      });
      expect(res.status).toBe(202);
    }
    const blocked = await app.request('/auth/code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-real-ip': '1.2.3.4' },
      body: JSON.stringify({ email: 'blocked@example.com' }),
    });
    expect(blocked.status).toBe(429);
  });
});
