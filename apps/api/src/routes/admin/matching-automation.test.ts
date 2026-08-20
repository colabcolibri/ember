import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import {
  createSession,
  ensureCommunityMember,
  ensureDatabaseReady,
  listMatchingAuditEvents,
  upsertMemberProfile,
  upsertRoundDeclaration,
  upsertUserByEmail,
} from '@ember/db';
import { createAdminRoutes } from './index.js';
import { SESSION_COOKIE } from '../../lib/session.js';

const SLOTS = ['mon-19h', 'tue-19h', 'wed-19h', 'thu-19h', 'sat-10h'] as const;

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

describe('matching automation routes', () => {
  let dbPath: string;
  let dir: string;
  let db: ReturnType<typeof ensureDatabaseReady>;
  let app: Hono;
  let facilitatorSession: string;
  let communityId: string;

  beforeEach(() => {
    process.env.EMBER_EMAIL_PEPPER = 'test-pepper';
    dir = mkdtempSync(join(tmpdir(), 'ember-matching-auto-'));
    dbPath = join(dir, 'test.db');
    db = ensureDatabaseReady(dbPath);
    app = new Hono();
    app.route('/admin', createAdminRoutes(db));

    communityId = 'comm-gsa';
    const pepper = 'test-pepper';
    const facilitatorId = upsertUserByEmail(db, 'fac@example.com', pepper);
    ensureCommunityMember(db, communityId, facilitatorId, 'facilitador');
    facilitatorSession = createSession(db, facilitatorId).sessionId;
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  async function seedRoundWithMembers(count: number) {
    const create = await app.request('/admin/matching-rounds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${SESSION_COOKIE}=${facilitatorSession}`,
      },
      body: JSON.stringify({
        theme: 'Tema piloto',
        questions: ['Pergunta 1'],
        slots: SLOTS,
        templateId: 'tpl-gsa-fogo',
      }),
    });
    const { round } = (await create.json()) as { round: { id: string } };

    for (let index = 0; index < count; index += 1) {
      const userId = upsertUserByEmail(db, `user-${index}@example.com`, 'test-pepper');
      ensureCommunityMember(db, communityId, userId);
      upsertMemberProfile(db, communityId, userId, {
        displayName: `User ${index}`,
        editionYear: 2021,
        timezone: 'America/Sao_Paulo',
        languages: index === count - 1 && count === 4 ? [] : ['pt'],
        originPlace: samplePlace,
        residencePlace: samplePlace,
      });
      upsertRoundDeclaration(db, round.id, userId, {
        slots: ['mon-evening'],
        intention: 'surprise',
      });
    }

    return round.id;
  }

  it('auto-match persists draft, audit log and unmatched reasons', async () => {
    const roundId = await seedRoundWithMembers(6);

    const res = await app.request(`/admin/matching-rounds/${roundId}/auto-match`, {
      method: 'POST',
      headers: { Cookie: `${SESSION_COOKIE}=${facilitatorSession}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      trios: unknown[];
      unmatched: number;
      unmatchedMembers: Array<{ userId: string; reasons: string[] }>;
      auditEventId: string;
    };
    expect(body.trios.length).toBe(2);
    expect(body.unmatched).toBe(0);
    expect(body.unmatchedMembers).toHaveLength(0);

    const audit = listMatchingAuditEvents(db, roundId);
    expect(audit.some((event) => event.action === 'auto_match')).toBe(true);

    const draft = await app.request(`/admin/matching-rounds/${roundId}/auto-match`, {
      headers: { Cookie: `${SESSION_COOKIE}=${facilitatorSession}` },
    });
    const draftBody = (await draft.json()) as { draft: { trios: unknown[] } | null };
    expect(draftBody.draft?.trios.length).toBe(2);
  });

  it('returns unmatched reasons for leftover members', async () => {
    const roundId = await seedRoundWithMembers(5);
    const res = await app.request(`/admin/matching-rounds/${roundId}/auto-match`, {
      method: 'POST',
      headers: { Cookie: `${SESSION_COOKIE}=${facilitatorSession}` },
    });
    const body = (await res.json()) as {
      unmatched: number;
      unmatchedMembers: Array<{ reasons: string[] }>;
    };
    expect(body.unmatched).toBeGreaterThan(0);
    expect(body.unmatchedMembers[0]?.reasons.length).toBeGreaterThan(0);
  });

  it('undo auto-match clears draft and logs audit', async () => {
    const roundId = await seedRoundWithMembers(3);
    await app.request(`/admin/matching-rounds/${roundId}/auto-match`, {
      method: 'POST',
      headers: { Cookie: `${SESSION_COOKIE}=${facilitatorSession}` },
    });

    const undo = await app.request(`/admin/matching-rounds/${roundId}/auto-match`, {
      method: 'DELETE',
      headers: { Cookie: `${SESSION_COOKIE}=${facilitatorSession}` },
    });
    const undoBody = (await undo.json()) as { removed: boolean };
    expect(undoBody.removed).toBe(true);

    const draft = await app.request(`/admin/matching-rounds/${roundId}/auto-match`, {
      headers: { Cookie: `${SESSION_COOKIE}=${facilitatorSession}` },
    });
    const clearedDraft = (await draft.json()) as { draft: null };
    expect(clearedDraft.draft).toBeNull();
    expect(listMatchingAuditEvents(db, roundId).some((event) => event.action === 'undo_auto_match')).toBe(true);
  });

  it('exports unmatched csv for facilitator', async () => {
    const roundId = await seedRoundWithMembers(4);
    await app.request(`/admin/matching-rounds/${roundId}/auto-match`, {
      method: 'POST',
      headers: { Cookie: `${SESSION_COOKIE}=${facilitatorSession}` },
    });

    const csv = await app.request(`/admin/matching-rounds/${roundId}/unmatched/export.csv`, {
      headers: { Cookie: `${SESSION_COOKIE}=${facilitatorSession}` },
    });
    expect(csv.status).toBe(200);
    expect(csv.headers.get('content-type')).toContain('text/csv');
    const text = await csv.text();
    expect(text).toContain('membro_id');
  });
});
