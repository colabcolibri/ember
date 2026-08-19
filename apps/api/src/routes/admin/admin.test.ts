import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import {
  createSession,
  ensureCommunityMember,
  ensureDatabaseReady,
  upsertMemberProfile,
  upsertRoundDeclaration,
  upsertUserByEmail,
} from '@ember/db';
import { createAdminRoutes } from './index.js';
import { SESSION_COOKIE } from '../../lib/session.js';

const SLOTS = ['mon-19h', 'tue-19h', 'wed-19h', 'thu-19h', 'sat-10h'] as const;
const roundBody = {
  theme: 'Conexão',
  questions: ['Como estamos?'],
  slots: SLOTS,
};

const samplePlace = {
  provider: 'geoapify' as const,
  placeId: 'place-sp',
  city: 'São Paulo',
  country: 'Brazil',
  countryCode: 'BR',
  latitude: -23.55,
  longitude: -46.63,
  label: 'São Paulo · Brazil',
};

describe('admin routes', () => {
  let dbPath: string;
  let db: ReturnType<typeof ensureDatabaseReady>;
  let app: Hono;
  let facilitatorSession: string;
  let memberSession: string;
  let communityId: string;

  beforeEach(() => {
    process.env.EMBER_EMAIL_PEPPER = 'test-pepper';
    const dir = mkdtempSync(join(tmpdir(), 'ember-api-admin-'));
    dbPath = join(dir, 'test.db');
    db = ensureDatabaseReady(dbPath);
    app = new Hono();
    app.route('/admin', createAdminRoutes(db));

    communityId = 'comm-gsa';
    const pepper = 'test-pepper';
    const facilitatorId = upsertUserByEmail(db, 'fac@example.com', pepper);
    const memberId = upsertUserByEmail(db, 'mem@example.com', pepper);
    ensureCommunityMember(db, communityId, facilitatorId, 'facilitador');
    ensureCommunityMember(db, communityId, memberId, 'member');
    facilitatorSession = createSession(db, facilitatorId).sessionId;
    memberSession = createSession(db, memberId).sessionId;
  });

  afterEach(() => {
    db?.close();
    if (dbPath) {
      rmSync(join(dbPath, '..'), { recursive: true, force: true });
    }
  });

  it('returns 403 for member creating round', async () => {
    const res = await app.request('/admin/matching-rounds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${SESSION_COOKIE}=${memberSession}`,
      },
      body: JSON.stringify(roundBody),
    });
    expect(res.status).toBe(403);
  });

  it('creates round as facilitator', async () => {
    const res = await app.request('/admin/matching-rounds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${SESSION_COOKIE}=${facilitatorSession}`,
      },
      body: JSON.stringify({ ...roundBody, templateId: 'tpl-gsa-fogo' }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { round: { id: string; status: string } };
    expect(body.round.status).toBe('open');
  });

  it('publishes circles with invited members', async () => {
    const create = await app.request('/admin/matching-rounds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${SESSION_COOKIE}=${facilitatorSession}`,
      },
      body: JSON.stringify({ theme: 'Tema piloto', questions: ['Pergunta 1'], slots: SLOTS, templateId: 'tpl-gsa-fogo' }),
    });
    const { round } = (await create.json()) as { round: { id: string } };

    const ids = ['u1', 'u2', 'u3'].map((label) =>
      upsertUserByEmail(db, `${label}@example.com`, 'test-pepper'),
    );
    for (const id of ids) {
      ensureCommunityMember(db, communityId, id);
      upsertMemberProfile(db, communityId, id, {
        displayName: 'Pilot',
        editionYear: 2021,
        timezone: 'America/Sao_Paulo',
        languages: ['pt'],
        originPlace: samplePlace,
        residencePlace: samplePlace,
      });
      upsertRoundDeclaration(db, round.id, id, {
        slots: ['mon-evening'],
        intention: 'surprise',
      });
    }

    const match = await app.request(`/admin/matching-rounds/${round.id}/match`, {
      method: 'POST',
      headers: { Cookie: `${SESSION_COOKIE}=${facilitatorSession}` },
    });
    const { trios } = (await match.json()) as { trios: { memberIds: string[]; slot: string }[] };
    expect(trios.length).toBeGreaterThan(0);

    const publish = await app.request(`/admin/matching-rounds/${round.id}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${SESSION_COOKIE}=${facilitatorSession}`,
      },
      body: JSON.stringify({ trios }),
    });
    expect(publish.status).toBe(200);

    const members = db
      .prepare('SELECT status FROM circle_members')
      .all() as { status: string }[];
    expect(members.every((m) => m.status === 'invited')).toBe(true);
  });
});
