import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import {
  createSession,
  ensureCommunityMember,
  ensureDatabaseReady,
  upsertUserByEmail,
} from '@ember/db';
import { resetEmailSenderCacheForTests, sendTransactionalEmail } from '@ember/email';
import { createAdminMembersRoutes } from './members.js';
import { SESSION_COOKIE } from '../../lib/session.js';
import { seedCompleteMemberProfile } from '../../test/complete-profile.js';

vi.mock('@ember/email', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ember/email')>();
  return {
    ...actual,
    sendTransactionalEmail: vi.fn(async () => ({ ok: true, provider: 'noop' as const })),
  };
});

describe('admin members routes', () => {
  let dbPath: string;
  let db: ReturnType<typeof ensureDatabaseReady>;
  let app: Hono;
  let orgAdminCookie: string;

  beforeEach(() => {
    resetEmailSenderCacheForTests();
    process.env.EMBER_EMAIL_PEPPER = 'test-pepper';
    process.env.EMBER_DEFAULT_COMMUNITY_SLUG = 'gsa-pilot';
    const dir = mkdtempSync(join(tmpdir(), 'ember-admin-members-'));
    dbPath = join(dir, 'test.db');
    db = ensureDatabaseReady(dbPath);

    const pepper = 'test-pepper';
    const adminId = upsertUserByEmail(db, 'admin@example.com', pepper);
    const community = db.prepare('SELECT id FROM communities WHERE slug = ?').get('gsa-pilot') as {
      id: string;
    };
    ensureCommunityMember(db, community.id, adminId, 'org_admin');
    seedCompleteMemberProfile(db, community.id, adminId, { displayName: 'Org Admin' });
    const session = createSession(db, adminId);
    orgAdminCookie = `${SESSION_COOKIE}=${session.sessionId}`;

    app = new Hono();
    app.route('/admin', createAdminMembersRoutes(db));
  });

  afterEach(() => {
    db?.close();
    if (dbPath) rmSync(join(dbPath, '..'), { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('lists members for org_admin', async () => {
    const res = await app.request('/admin/members', {
      headers: { Cookie: orgAdminCookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: unknown[] };
    expect(body.items.length).toBeGreaterThan(0);
  });

  it('creates invite and sends email', async () => {
    const res = await app.request('/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: orgAdminCookie },
      body: JSON.stringify({ email: 'new@example.com', displayName: 'Nova' }),
    });
    expect(res.status).toBe(201);
    expect(sendTransactionalEmail).toHaveBeenCalled();
  });

  it('forbids facilitador on members list', async () => {
    const pepper = 'test-pepper';
    const facilitatorId = upsertUserByEmail(db, 'fac@example.com', pepper);
    const community = db.prepare('SELECT id FROM communities WHERE slug = ?').get('gsa-pilot') as {
      id: string;
    };
    ensureCommunityMember(db, community.id, facilitatorId, 'facilitador');
    const session = createSession(db, facilitatorId);

    const res = await app.request('/admin/members', {
      headers: { Cookie: `${SESSION_COOKIE}=${session.sessionId}` },
    });
    expect(res.status).toBe(403);
  });

  it('imports csv with partial errors', async () => {
    const csv = 'email,name\nvalid@example.com,Valid\nbad-line\nother@example.com,Other';
    const res = await app.request('/admin/invites/import', {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv', Cookie: orgAdminCookie },
      body: csv,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { created: number; errors: unknown[] };
    expect(body.created).toBe(2);
    expect(body.errors.length).toBe(1);
  });
});
