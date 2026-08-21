import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { createLoginCode, ensureCommunityMember, ensureDatabaseReady, getMemberRole, upsertUserByEmail } from '@ember/db';
import { resetEmailSenderCacheForTests, sendTransactionalEmail } from '@ember/email';
import { createAuthRoutes } from './auth.js';
import { resetRateLimitsForTests } from '../lib/rate-limit.js';
import { SESSION_COOKIE } from '../lib/session.js';

vi.mock('@ember/email', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ember/email')>();
  return {
    ...actual,
    sendTransactionalEmail: vi.fn(actual.sendTransactionalEmail),
  };
});

describe('auth routes', () => {
  let dbPath: string;
  let db: ReturnType<typeof ensureDatabaseReady>;
  let app: Hono;

  beforeEach(() => {
    resetEmailSenderCacheForTests();
    resetRateLimitsForTests();
    vi.mocked(sendTransactionalEmail).mockImplementation(async (input) => {
      const { sendTransactionalEmail: realSend } = await vi.importActual<typeof import('@ember/email')>(
        '@ember/email',
      );
      return realSend(input);
    });
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
    vi.clearAllMocks();
  });

  it('returns guest session without cookie', async () => {
    const res = await app.request('/auth/session');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { authenticated: boolean };
    expect(body).toEqual({ authenticated: false });
  });

  it('returns authenticated session with roles', async () => {
    const pepper = 'test-pepper';
    const { code } = createLoginCode(db, 'admin@example.com', pepper);

    const verifyRes = await app.request('/auth/code/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', code }),
    });
    const sessionCookie = verifyRes.headers.get('set-cookie') ?? '';

    process.env.EMBER_BOOTSTRAP_ADMIN_EMAIL = 'admin@example.com';
    const communityId = db.prepare('SELECT id FROM communities WHERE slug = ?').get('gsa-pilot') as {
      id: string;
    };
    const userId = db.prepare('SELECT id FROM users LIMIT 1').get() as { id: string };
    db.prepare('UPDATE community_members SET role = ? WHERE community_id = ? AND user_id = ?').run(
      'org_admin',
      communityId.id,
      userId.id,
    );

    const res = await app.request('/auth/session', {
      headers: { Cookie: sessionCookie.split(';')[0] ?? '' },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      authenticated: boolean;
      role: string;
      isFacilitator: boolean;
      isOrgAdmin: boolean;
    };
    expect(body.authenticated).toBe(true);
    expect(body.role).toBe('org_admin');
    expect(body.isFacilitator).toBe(true);
    expect(body.isOrgAdmin).toBe(true);
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

  it('returns 503 when email send fails', async () => {
    vi.mocked(sendTransactionalEmail).mockResolvedValueOnce({
      ok: false,
      provider: 'smtp',
      error: 'connection refused',
    });

    const res = await app.request('/auth/code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'member@example.com' }),
    });
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('EMAIL_UNAVAILABLE');
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

  it('bootstrap email receives org_admin role', async () => {
    process.env.EMBER_BOOTSTRAP_ADMIN_EMAIL = 'admin@example.com';
    const pepper = 'test-pepper';
    const { code } = createLoginCode(db, 'admin@example.com', pepper);

    const res = await app.request('/auth/code/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', code }),
    });
    expect(res.status).toBe(200);

    const communityId = db.prepare('SELECT id FROM communities WHERE slug = ?').get('gsa-pilot') as {
      id: string;
    };
    const userId = db.prepare('SELECT id FROM users LIMIT 1').get() as { id: string };
    expect(getMemberRole(db, communityId.id, userId.id)).toBe('org_admin');
  });

  it('legacy bootstrap env var still assigns org_admin', async () => {
    delete process.env.EMBER_BOOTSTRAP_ADMIN_EMAIL;
    process.env.EMBER_BOOTSTRAP_FACILITATOR_EMAIL = 'legacy@example.com';
    const pepper = 'test-pepper';
    const { code } = createLoginCode(db, 'legacy@example.com', pepper);

    const res = await app.request('/auth/code/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'legacy@example.com', code }),
    });
    expect(res.status).toBe(200);

    const communityId = db.prepare('SELECT id FROM communities WHERE slug = ?').get('gsa-pilot') as {
      id: string;
    };
    const userId = db.prepare('SELECT id FROM users WHERE email_hash IS NOT NULL LIMIT 1').get() as {
      id: string;
    };
    expect(getMemberRole(db, communityId.id, userId.id)).toBe('org_admin');
  });

  it('bootstrap admin is promoted from facilitador on login', async () => {
    process.env.EMBER_BOOTSTRAP_ADMIN_EMAIL = 'admin@example.com';
    const pepper = 'test-pepper';
    const userId = upsertUserByEmail(db, 'admin@example.com', pepper);
    const communityId = db.prepare('SELECT id FROM communities WHERE slug = ?').get('gsa-pilot') as {
      id: string;
    };
    ensureCommunityMember(db, communityId.id, userId, 'facilitador');
    expect(getMemberRole(db, communityId.id, userId)).toBe('facilitador');

    const { code } = createLoginCode(db, 'admin@example.com', pepper);
    const res = await app.request('/auth/code/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', code }),
    });
    expect(res.status).toBe(200);
    expect(getMemberRole(db, communityId.id, userId)).toBe('org_admin');
  });

  it('logout clears session cookie', async () => {
    const pepper = 'test-pepper';
    const { code } = createLoginCode(db, 'member@example.com', pepper);

    const verifyRes = await app.request('/auth/code/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'member@example.com', code }),
    });
    const sessionCookie = verifyRes.headers.get('set-cookie') ?? '';

    const logoutRes = await app.request('/auth/logout', {
      method: 'POST',
      headers: { Cookie: sessionCookie.split(';')[0] ?? '' },
    });
    expect(logoutRes.status).toBe(200);
    const cleared = logoutRes.headers.get('set-cookie') ?? '';
    expect(cleared).toContain(`${SESSION_COOKIE}=`);
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
