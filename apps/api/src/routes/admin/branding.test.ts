import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import {
  createSession,
  ensureCommunityMember,
  ensureDatabaseReady,
  upsertUserByEmail,
} from '@ember/db';
import { resetEmailSenderCacheForTests } from '@ember/email';
import { createAdminBrandingRoutes } from './branding.js';
import { SESSION_COOKIE } from '../../lib/session.js';

describe('admin branding routes', () => {
  let dbPath: string;
  let db: ReturnType<typeof ensureDatabaseReady>;
  let app: Hono;
  let orgAdminCookie: string;

  beforeEach(() => {
    resetEmailSenderCacheForTests();
    process.env.EMBER_EMAIL_PEPPER = 'test-pepper';
    process.env.EMBER_DEFAULT_COMMUNITY_SLUG = 'gsa-pilot';
    const dir = mkdtempSync(join(tmpdir(), 'ember-admin-branding-'));
    dbPath = join(dir, 'test.db');
    db = ensureDatabaseReady(dbPath);

    const pepper = 'test-pepper';
    const adminId = upsertUserByEmail(db, 'admin@example.com', pepper);
    const community = db.prepare('SELECT id FROM communities WHERE slug = ?').get('gsa-pilot') as {
      id: string;
    };
    ensureCommunityMember(db, community.id, adminId, 'org_admin');
    const session = createSession(db, adminId);
    orgAdminCookie = `${SESSION_COOKIE}=${session.sessionId}`;

    app = new Hono();
    app.route('/admin', createAdminBrandingRoutes(db));
  });

  afterEach(() => {
    db?.close();
    if (dbPath) rmSync(join(dbPath, '..'), { recursive: true, force: true });
  });

  it('updates branding for org_admin', async () => {
    const res = await app.request('/admin/community/branding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: orgAdminCookie },
      body: JSON.stringify({
        hero: { title: 'Comunidade teste', subtitle: 'Subtítulo' },
        theme: { preset: 'warm' },
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { settings: { hero?: { title?: string }; theme?: { preset?: string } } };
    expect(body.settings.hero?.title).toBe('Comunidade teste');
    expect(body.settings.theme?.preset).toBe('warm');
  });

  it('forbids facilitador', async () => {
    const pepper = 'test-pepper';
    const facilitatorId = upsertUserByEmail(db, 'fac@example.com', pepper);
    const community = db.prepare('SELECT id FROM communities WHERE slug = ?').get('gsa-pilot') as {
      id: string;
    };
    ensureCommunityMember(db, community.id, facilitatorId, 'facilitador');
    const session = createSession(db, facilitatorId);

    const res = await app.request('/admin/community/branding', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${SESSION_COOKIE}=${session.sessionId}`,
      },
      body: JSON.stringify({ hero: { title: 'Nope' } }),
    });
    expect(res.status).toBe(403);
  });
});
