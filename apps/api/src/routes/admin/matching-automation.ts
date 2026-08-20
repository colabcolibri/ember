import { Hono } from 'hono';
import type { ensureDatabaseReady } from '@ember/db';
import {
  deleteMatchingRoundDraft,
  findRoundById,
  insertMatchingAuditEvent,
  listRoundDeclarations,
  loadMatchingMembers,
  loadMetPairs,
} from '@ember/db';
import {
  publishGroupsSchema,
  publishMatchSchema,
  runMatchingEngine,
  analyzeUnmatched,
  type UnmatchedReason,
} from '@ember/domain';
import { requireEmailPepper } from '@ember/email';
import { createRequireFacilitator, type FacilitatorVariables } from '../../lib/facilitator.js';
import {
  executeAutoMatch,
  loadAutoMatchDraft,
  undoAutoMatch,
  updateAutoMatchDraftGroups,
} from '../../services/matching-auto.js';
import { retryCircleFormedEmails } from '../../services/circle-notifications.js';

type Db = ReturnType<typeof ensureDatabaseReady>;

function requireRoundId(roundId: string | undefined): roundId is string {
  return Boolean(roundId?.trim());
}

function assertClosedForMatchingRound(
  db: Db,
  communityId: string,
  roundId: string,
): { ok: true; round: NonNullable<ReturnType<typeof findRoundById>> } | { ok: false; status: number; code: string; message: string } {
  const round = findRoundById(db, roundId);
  if (!round || round.community_id !== communityId) {
    return { ok: false, status: 404, code: 'NOT_FOUND', message: 'Convite não encontrado' };
  }
  if (round.status === 'published') {
    return { ok: false, status: 400, code: 'ALREADY_PUBLISHED', message: 'Encontros já publicados' };
  }
  if (round.status !== 'closed') {
    return {
      ok: false,
      status: 400,
      code: 'ROUND_NOT_CLOSED',
      message: 'Encerre as inscrições antes de sortear',
    };
  }
  return { ok: true, round };
}

function unmatchedReasonLabel(reason: UnmatchedReason, locale: 'pt' | 'en'): string {
  const labels: Record<UnmatchedReason, { pt: string; en: string }> = {
    INCOMPLETE_PROFILE: {
      pt: 'Perfil incompleto — peça para completar idiomas e fuso',
      en: 'Incomplete profile — ask them to complete languages and timezone',
    },
    NO_COMMON_LANGUAGE: {
      pt: 'Sem idioma em comum com outros inscritos',
      en: 'No common language with other participants',
    },
    NO_COMMON_SLOT: {
      pt: 'Sem horário em comum para formar trio',
      en: 'No shared slot to form a trio',
    },
    ODD_POOL: {
      pt: 'Número ímpar de inscritos — sobra após formar trios',
      en: 'Odd participant count — leftover after forming trios',
    },
  };
  return labels[reason][locale];
}

export function createAdminMatchingAutomationRoutes(db: Db) {
  const routes = new Hono<{ Variables: FacilitatorVariables }>();
  const requireFacilitator = createRequireFacilitator(db);
  routes.use('*', requireFacilitator);

  routes.post('/matching-rounds/:id/auto-match', async (c) => {
    const communityId = c.get('communityId');
    const userId = c.get('userId');
    const roundId = c.req.param('id');
    if (!requireRoundId(roundId)) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Convite inválido' } }, 400);
    }

    const check = assertClosedForMatchingRound(db, communityId, roundId);
    if (!check.ok) {
      return c.json({ error: { code: check.code, message: check.message } }, check.status);
    }

    try {
      const result = executeAutoMatch(db, { communityId, roundId, actorUserId: userId });
      return c.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'NOT_ENOUGH_MEMBERS') {
        return c.json(
          { error: { code: 'NOT_ENOUGH_MEMBERS', message: 'Pelo menos 2 inscritos são necessários' } },
          400,
        );
      }
      throw error;
    }
  });

  routes.get('/matching-rounds/:id/auto-match', (c) => {
    const communityId = c.get('communityId');
    const roundId = c.req.param('id');
    if (!requireRoundId(roundId)) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Convite inválido' } }, 400);
    }

    const round = findRoundById(db, roundId);
    if (!round || round.community_id !== communityId) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Convite não encontrado' } }, 404);
    }

    const draft = loadAutoMatchDraft(db, roundId);
    if (!draft) {
      return c.json({ draft: null });
    }

    return c.json({
      draft: {
        groups: draft.groups,
        trios: draft.trios,
        unmatched: draft.unmatchedMembers.length,
        unmatchedMembers: draft.unmatchedMembers,
        triggeredBy: draft.triggeredBy,
        createdAt: draft.createdAt,
      },
    });
  });

  routes.delete('/matching-rounds/:id/auto-match', (c) => {
    const communityId = c.get('communityId');
    const userId = c.get('userId');
    const roundId = c.req.param('id');
    if (!requireRoundId(roundId)) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Convite inválido' } }, 400);
    }

    const round = findRoundById(db, roundId);
    if (!round || round.community_id !== communityId) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Convite não encontrado' } }, 404);
    }

    const removed = undoAutoMatch(db, { roundId, actorUserId: userId });
    return c.json({ removed });
  });

  routes.put('/matching-rounds/:id/auto-match/groups', async (c) => {
    const communityId = c.get('communityId');
    const userId = c.get('userId');
    const roundId = c.req.param('id');
    if (!requireRoundId(roundId)) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Convite inválido' } }, 400);
    }

    const check = assertClosedForMatchingRound(db, communityId, roundId);
    if (!check.ok) {
      return c.json({ error: { code: check.code, message: check.message } }, check.status);
    }

    const body = await c.req.json().catch(() => null);
    const parsed = publishGroupsSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Grupos inválidos', details: parsed.error.issues } },
        400,
      );
    }

    const members = loadMatchingMembers(db, communityId, roundId);
    const unmatchedMembers = analyzeUnmatched(members, parsed.data.groups);

    try {
      updateAutoMatchDraftGroups(db, {
        roundId,
        groups: parsed.data.groups.map((group) => ({ ...group, score: group.score ?? 0 })),
        unmatchedMembers,
        actorUserId: userId,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'DRAFT_NOT_FOUND') {
        return c.json({ error: { code: 'DRAFT_NOT_FOUND', message: 'Sorteio automático não encontrado' } }, 404);
      }
      throw error;
    }

    return c.json({ groups: parsed.data.groups, unmatchedMembers });
  });

  routes.put('/matching-rounds/:id/auto-match/trios', async (c) => {
    const communityId = c.get('communityId');
    const userId = c.get('userId');
    const roundId = c.req.param('id');
    if (!requireRoundId(roundId)) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Convite inválido' } }, 400);
    }

    const check = assertClosedForMatchingRound(db, communityId, roundId);
    if (!check.ok) {
      return c.json({ error: { code: check.code, message: check.message } }, check.status);
    }

    const body = await c.req.json().catch(() => null);
    const parsed = publishMatchSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Grupos inválidos', details: parsed.error.issues } },
        400,
      );
    }

    const members = loadMatchingMembers(db, communityId, roundId);
    const unmatchedMembers = analyzeUnmatched(members, parsed.data.groups);

    try {
      updateAutoMatchDraftGroups(db, {
        roundId,
        groups: parsed.data.groups,
        unmatchedMembers,
        actorUserId: userId,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'DRAFT_NOT_FOUND') {
        return c.json({ error: { code: 'DRAFT_NOT_FOUND', message: 'Sorteio automático não encontrado' } }, 404);
      }
      throw error;
    }

    return c.json({ groups: parsed.data.groups, trios: parsed.data.groups, unmatchedMembers });
  });

  routes.get('/matching-rounds/:id/unmatched/export.csv', (c) => {
    const communityId = c.get('communityId');
    const roundId = c.req.param('id');
    const locale = c.req.query('locale') === 'en' ? 'en' : 'pt';
    if (!requireRoundId(roundId)) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Convite inválido' } }, 400);
    }

    const round = findRoundById(db, roundId);
    if (!round || round.community_id !== communityId) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Convite não encontrado' } }, 404);
    }

    const draft = loadAutoMatchDraft(db, roundId);
    const members = loadMatchingMembers(db, communityId, roundId);
    const metPairs = loadMetPairs(db, communityId);
    const fallback = runMatchingEngine(members, metPairs);
    const unmatchedMembers = draft?.unmatchedMembers ?? fallback.unmatchedMembers;

    const pepper = requireEmailPepper();
    const { items } = listRoundDeclarations(db, roundId, 1, 500, pepper);
    const nameByUser = new Map(items.map((item) => [item.userId, item.memberLabel]));

    const header = locale === 'en' ? 'member_id,name,reasons' : 'membro_id,nome,motivos';
    const rows = unmatchedMembers.map((row) => {
      const reasons = row.reasons.map((reason) => unmatchedReasonLabel(reason, locale)).join(' | ');
      const name = nameByUser.get(row.userId) ?? row.userId;
      return `${row.userId},"${name.replace(/"/g, '""')}","${reasons.replace(/"/g, '""')}"`;
    });

    const csv = [header, ...rows].join('\n');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="unmatched-${roundId}.csv"`,
      },
    });
  });

  routes.post('/matching-rounds/:id/publish/retry-emails', async (c) => {
    const communityId = c.get('communityId');
    const roundId = c.req.param('id');
    if (!requireRoundId(roundId)) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Convite inválido' } }, 400);
    }

    const round = findRoundById(db, roundId);
    if (!round || round.community_id !== communityId) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Convite não encontrado' } }, 404);
    }

    const body = (await c.req.json().catch(() => null)) as {
      targets?: Array<{ circleId: string; userId: string }>;
    } | null;
    if (!body?.targets?.length) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Nenhum destino informado' } }, 400);
    }

    const result = await retryCircleFormedEmails(db, {
      communityId,
      roundId,
      question: round.question ?? '',
      targets: body.targets,
    });

    return c.json(result);
  });

  return routes;
}

export function recordPublishAudit(
  db: Db,
  input: { roundId: string; actorUserId: string; circleCount: number; emailsSent: number; emailsFailed: number },
): void {
  insertMatchingAuditEvent(db, {
    roundId: input.roundId,
    actorUserId: input.actorUserId,
    action: 'publish',
    payload: {
      circleCount: input.circleCount,
      emailsSent: input.emailsSent,
      emailsFailed: input.emailsFailed,
    },
  });
  deleteMatchingRoundDraft(db, input.roundId);
}
