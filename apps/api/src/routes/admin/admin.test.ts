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
  provider: 'photon' as const,
  placeId: 'R298019',
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

  it('lists matching rounds for facilitator', async () => {
    await app.request('/admin/matching-rounds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${SESSION_COOKIE}=${facilitatorSession}`,
      },
      body: JSON.stringify({ ...roundBody, templateId: 'tpl-gsa-fogo' }),
    });

    const res = await app.request('/admin/matching-rounds', {
      headers: { Cookie: `${SESSION_COOKIE}=${facilitatorSession}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      rounds: Array<{ id: string; status: string; declarationCount: number }>;
    };
    expect(body.rounds.length).toBeGreaterThan(0);
    expect(body.rounds.some((round) => round.status === 'open')).toBe(true);
  });

  it('returns current open round with declaration count', async () => {
    const create = await app.request('/admin/matching-rounds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${SESSION_COOKIE}=${facilitatorSession}`,
      },
      body: JSON.stringify({ ...roundBody, templateId: 'tpl-gsa-fogo' }),
    });
    const created = (await create.json()) as { round: { id: string } };

    upsertRoundDeclaration(db, created.round.id, upsertUserByEmail(db, 'mem@example.com', 'test-pepper'), {
      slots: ['mon-19h'],
      intention: 'ease',
    });

    const res = await app.request('/admin/matching-rounds/current', {
      headers: { Cookie: `${SESSION_COOKIE}=${facilitatorSession}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      round: { id: string; theme: string | null; slotLabels: Record<string, string> } | null;
      declarationCount: number;
    };
    expect(body.round?.id).toBe(created.round.id);
    expect(body.declarationCount).toBe(1);
    expect(body.round?.theme).toBe('Conexão');
  });

  it('lists meeting templates', async () => {
    const res = await app.request('/admin/templates', {
      headers: { Cookie: `${SESSION_COOKIE}=${facilitatorSession}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { templates: Array<{ id: string; name: string }> };
    expect(body.templates.some((t) => t.id === 'tpl-gsa-fogo')).toBe(true);
  });

  it('creates meeting template', async () => {
    const res = await app.request('/admin/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${SESSION_COOKIE}=${facilitatorSession}`,
      },
      body: JSON.stringify({
        name: 'Café com intenção',
        circleSize: 4,
        durationMinutes: 45,
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { template: { name: string; circleSize: number } };
    expect(body.template.name).toBe('Café com intenção');
    expect(body.template.circleSize).toBe(4);
  });

  it('returns 403 for member listing templates', async () => {
    const res = await app.request('/admin/templates', {
      headers: { Cookie: `${SESSION_COOKIE}=${memberSession}` },
    });
    expect(res.status).toBe(403);
  });

  it('lists regional slot calendars', async () => {
    const res = await app.request('/admin/slot-calendars', {
      headers: { Cookie: `${SESSION_COOKIE}=${facilitatorSession}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { calendars: Array<{ label: string; entries: unknown[] }> };
    expect(body.calendars.some((c) => c.label === 'Americas')).toBe(true);
    expect(body.calendars.some((c) => c.label === 'Europe')).toBe(true);
  });

  it('creates round with regional slot refs', async () => {
    const res = await app.request('/admin/matching-rounds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${SESSION_COOKIE}=${facilitatorSession}`,
      },
      body: JSON.stringify({
        theme: 'Rede global',
        questions: ['Como nos encontramos?'],
        slots: ['cal-americas:slot-mon-1900', 'cal-europe:slot-sun-1300'],
        templateId: 'tpl-gsa-fogo',
      }),
    });
    expect(res.status).toBe(201);
  });

  it('creates round with datetime slots', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    const localDate = futureDate.toISOString().slice(0, 10);

    const res = await app.request('/admin/matching-rounds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${SESSION_COOKIE}=${facilitatorSession}`,
      },
      body: JSON.stringify({
        theme: 'Encontro agendado',
        questions: ['Como estamos?'],
        slots: [{ timezone: 'America/Sao_Paulo', localDate, localTime: '19:00' }],
        templateId: 'tpl-gsa-fogo',
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      round: { slots: Array<{ ref: string; timezone: string; startsAt: string }> };
    };
    expect(body.round.slots[0]?.ref).toMatch(/^dt:/);
    expect(body.round.slots[0]?.timezone).toBe('America/Sao_Paulo');
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

    await app.request(`/admin/matching-rounds/${round.id}/close`, {
      method: 'POST',
      headers: { Cookie: `${SESSION_COOKIE}=${facilitatorSession}` },
    });

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
