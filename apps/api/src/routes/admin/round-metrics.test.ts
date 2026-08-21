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
  recordCircleAttendance,
  persistCircleParticipations,
  upsertMemberProfile,
  upsertRoundDeclaration,
  upsertUserByEmail,
} from '@ember/db';
import { createAdminRoutes } from './index.js';
import { SESSION_COOKIE } from '../../lib/session.js';
import { seedCompleteMemberProfile } from '../../test/complete-profile.js';

const samplePlace = {
  provider: 'photon' as const,
  placeId: 'R298019',
  city: 'São Paulo',
  country: 'Brazil',
  countryCode: 'BR',
  latitude: -23.55,
  longitude: -46.63,
  label: 'São Paulo · Brazil',
};

describe('round metrics routes', () => {
  let dir: string;
  let db: ReturnType<typeof ensureDatabaseReady>;
  let app: Hono;
  let facilitatorSession: string;
  let communityId: string;

  beforeEach(() => {
    process.env.EMBER_EMAIL_PEPPER = 'test-pepper';
    dir = mkdtempSync(join(tmpdir(), 'ember-round-metrics-'));
    db = ensureDatabaseReady(join(dir, 'test.db'));
    app = new Hono();
    app.route('/admin', createAdminRoutes(db));

    communityId = 'comm-gsa';
    const pepper = 'test-pepper';
    const facilitatorId = upsertUserByEmail(db, 'fac@example.com', pepper);
    ensureCommunityMember(db, communityId, facilitatorId, 'facilitador');
    seedCompleteMemberProfile(db, communityId, facilitatorId, { displayName: 'Facilitator' });
    facilitatorSession = createSession(db, facilitatorId).sessionId;
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  async function createPublishedRound(label: string) {
    const create = await app.request('/admin/matching-rounds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${SESSION_COOKIE}=${facilitatorSession}`,
      },
      body: JSON.stringify({
        theme: `Tema ${label}`,
        questions: ['Pergunta'],
        slots: ['mon-19h'],
        templateId: 'tpl-gsa-fogo',
      }),
    });
    const { round } = (await create.json()) as { round: { id: string } };
    const ids = ['a', 'b', 'c'].map((suffix) => {
      const userId = upsertUserByEmail(db, `${label}-${suffix}@example.com`, 'test-pepper');
      ensureCommunityMember(db, communityId, userId);
      upsertMemberProfile(db, communityId, userId, {
        displayName: `User ${suffix}`,
        editionYear: 2018 + suffix.charCodeAt(0) % 5,
        timezone: 'America/Sao_Paulo',
        languages: suffix === 'c' ? ['en'] : ['pt'],
        originPlace: samplePlace,
        residencePlace: samplePlace,
      });
      upsertRoundDeclaration(db, round.id, userId, {
        slots: ['mon-evening'],
        intention: 'surprise',
      });
      return userId;
    });

    const circles = publishTriosWithDelivery(db, round.id, [
      {
        memberIds: [ids[0]!, ids[1]!, ids[2]!],
        slot: 'mon-19h',
        score: 1,
      },
    ]);

    const circleId = circles[0]!.id;
    recordCircleAttendance(db, circleId, ids[0]!, true);
    recordCircleAttendance(db, circleId, ids[1]!, true);
    recordCircleAttendance(db, circleId, ids[2]!, false);
    persistCircleParticipations(db, communityId, circleId, new Date().toISOString());

    return round.id;
  }

  it('returns aggregated metrics with previous round delta', async () => {
    const firstRoundId = await createPublishedRound('first');
    const secondRoundId = await createPublishedRound('second');

    const res = await app.request(`/admin/matching-rounds/${secondRoundId}/metrics`, {
      headers: { Cookie: `${SESSION_COOKIE}=${facilitatorSession}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      metrics: {
        newPairs: number;
        noShow: { rate: number | null; no: number };
        diversity: { languages: string[]; countries: string[] };
      };
      previous: { roundId: string; delta: { newPairs: number } } | null;
    };

    expect(body.metrics.newPairs).toBeGreaterThan(0);
    expect(body.metrics.noShow.no).toBe(1);
    expect(body.metrics.diversity.languages.length).toBeGreaterThan(0);
    expect(body.previous?.roundId).toBe(firstRoundId);
  });
});
