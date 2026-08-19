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
import { createProfileRoutes } from './profile.js';
import { SESSION_COOKIE } from '../lib/session.js';

const samplePlace = {
  provider: 'photon' as const,
  placeId: 'R12345',
  city: 'Lisbon',
  country: 'Portugal',
  countryCode: 'PT',
  latitude: 38.7223,
  longitude: -9.1393,
  label: 'Lisbon · Portugal',
};

describe('profile routes', () => {
  let dbPath: string;
  let db: ReturnType<typeof ensureDatabaseReady>;
  let app: Hono;
  let sessionId: string;
  const communityId = 'comm-gsa';
  const pepper = 'test-pepper';

  beforeEach(() => {
    process.env.EMBER_EMAIL_PEPPER = pepper;
    const dir = mkdtempSync(join(tmpdir(), 'ember-api-profile-'));
    dbPath = join(dir, 'test.db');
    db = ensureDatabaseReady(dbPath);
    app = new Hono();
    app.route('/me', createProfileRoutes(db));

    const userId = upsertUserByEmail(db, 'ana@example.com', pepper);
    ensureCommunityMember(db, communityId, userId);
    sessionId = createSession(db, userId).sessionId;
  });

  afterEach(() => {
    db?.close();
    if (dbPath) {
      rmSync(join(dbPath, '..'), { recursive: true, force: true });
    }
  });

  it('returns defaults for new profile', async () => {
    const res = await app.request('/me/profile', {
      headers: { Cookie: `${SESSION_COOKIE}=${sessionId}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      displayName: string;
      editionYear: number | null;
      role: string;
      isFacilitator: boolean;
    };
    expect(body.displayName).toBe('');
    expect(body.editionYear).toBeNull();
    expect(body.role).toBe('member');
    expect(body.isFacilitator).toBe(false);
  });

  it('persists display name and edition year', async () => {
    const put = await app.request('/me/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${SESSION_COOKIE}=${sessionId}`,
      },
      body: JSON.stringify({
        displayName: 'Ana Silva',
        editionYear: 2020,
        timezone: 'Europe/Lisbon',
        languages: ['pt', 'en'],
        originPlace: samplePlace,
        residencePlace: { ...samplePlace, placeId: 'R111', city: 'Porto', label: 'Porto · Portugal' },
      }),
    });
    expect(put.status).toBe(200);

    const get = await app.request('/me/profile', {
      headers: { Cookie: `${SESSION_COOKIE}=${sessionId}` },
    });
    const body = (await get.json()) as {
      displayName: string;
      editionYear: number;
      timezone: string;
    };
    expect(body.displayName).toBe('Ana Silva');
    expect(body.editionYear).toBe(2020);
    expect(body.timezone).toBe('Europe/Lisbon');
  });
});
