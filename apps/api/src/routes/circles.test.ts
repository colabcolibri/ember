import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import {
  createSession,
  ensureCommunityMember,
  ensureDatabaseReady,
  publishTriosWithDelivery,
  upsertMemberProfile,
  upsertRoundDeclaration,
  upsertUserByEmail,
} from '@ember/db';
import { resetEmailSenderCacheForTests } from '@ember/email';
import { createCircleRoutes } from './circles.js';
import { SESSION_COOKIE } from '../lib/session.js';

const samplePlace = {
  provider: 'geoapify' as const,
  placeId: 'place-sp',
  city: 'São Paulo',
  adminArea: 'SP',
  country: 'Brazil',
  countryCode: 'BR',
  latitude: -23.55,
  longitude: -46.63,
  label: 'São Paulo, SP · Brazil',
};

describe('circle routes', () => {
  let dbPath: string;
  let db: ReturnType<typeof ensureDatabaseReady>;
  let app: Hono;
  let sessionId: string;
  let userId: string;
  let circleId: string;
  const communityId = 'comm-gsa';
  const pepper = 'test-pepper';

  beforeEach(() => {
    resetEmailSenderCacheForTests();
    process.env.EMBER_EMAIL_PEPPER = pepper;
    process.env.EMBER_EMAIL_PROVIDER = 'noop';
    const dir = mkdtempSync(join(tmpdir(), 'ember-api-circles-'));
    dbPath = join(dir, 'test.db');
    db = ensureDatabaseReady(dbPath);
    app = new Hono();
    app.route('/circles', createCircleRoutes(db));

    userId = upsertUserByEmail(db, 'member@example.com', pepper);
    ensureCommunityMember(db, communityId, userId);
    upsertMemberProfile(db, communityId, userId, {
      displayName: 'Member',
      editionYear: 2020,
      timezone: 'America/Sao_Paulo',
      languages: ['pt'],
      originPlace: samplePlace,
      residencePlace: samplePlace,
    });
    sessionId = createSession(db, userId).sessionId;

    const peers = ['a@example.com', 'b@example.com'].map((email) => {
      const id = upsertUserByEmail(db, email, pepper);
      ensureCommunityMember(db, communityId, id);
      upsertMemberProfile(db, communityId, id, {
        displayName: 'Peer',
        editionYear: 2019,
        timezone: 'America/Sao_Paulo',
        languages: ['pt'],
        originPlace: samplePlace,
        residencePlace: samplePlace,
      });
      return id;
    });

    db.prepare(
      `INSERT INTO rounds (id, community_id, status, question, slots_json, template_id, created_at)
       VALUES ('round-test', ?, 'published', 'Tema?', '[]', 'tpl-gsa-fogo', datetime('now'))`,
    ).run(communityId);
    for (const peerId of peers) {
      upsertRoundDeclaration(db, 'round-test', peerId, {
        slots: ['mon-evening'],
        intention: 'surprise',
      });
    }
    upsertRoundDeclaration(db, 'round-test', userId, {
      slots: ['mon-evening'],
      intention: 'surprise',
    });

    const [circle] = publishTriosWithDelivery(
      db,
      'round-test',
      [
        {
          memberIds: [userId, peers[0]!, peers[1]!],
          slot: 'mon-19h',
          score: 10,
        },
      ],
      'https://meet.jit.si',
    );
    circleId = circle!.id;
    const past = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    db.prepare('UPDATE circles SET scheduled_at = ? WHERE id = ?').run(past, circleId);
  });

  afterEach(() => {
    db?.close();
    if (dbPath) rmSync(join(dbPath, '..'), { recursive: true, force: true });
  });

  it('lists member circles with jitsi url', async () => {
    const res = await app.request('/circles', {
      headers: { Cookie: `${SESSION_COOKIE}=${sessionId}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { circles: { id: string; jitsiUrl: string }[] };
    expect(body.circles[0]?.jitsiUrl).toContain('meet.jit.si');
  });

  it('records attendance and persists participations when all yes', async () => {
    const members = db
      .prepare('SELECT user_id FROM circle_members WHERE circle_id = ?')
      .all(circleId) as { user_id: string }[];

    for (const member of members) {
      const sid = createSession(db, member.user_id).sessionId;
      const res = await app.request(`/circles/${circleId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${SESSION_COOKIE}=${sid}`,
        },
        body: JSON.stringify({ happened: true }),
      });
      expect(res.status).toBe(200);
    }

    const pairs = db.prepare('SELECT COUNT(*) as c FROM meeting_participations').get() as { c: number };
    expect(pairs.c).toBe(3);
  });
});
