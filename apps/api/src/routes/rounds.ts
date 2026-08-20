import { Hono } from 'hono';
import type { ensureDatabaseReady } from '@ember/db';
import {
  findOpenRound,
  findRoundById,
  findTemplateById,
  getMemberProfile,
  getRoundDeclaration,
  listAllRegionalSlotOptions,
  listOpenRounds,
  resolveRoundSlotOptionsFromJson,
  updateMemberTimezone,
  upsertRoundDeclaration,
  type RoundDetailRow,
} from '@ember/db';
import { isStoredRoundSlot, parseRoundSlotsJson, presenceInputSchema, ROUND_SLOTS } from '@ember/domain';
import { createRequireAuth, resolveCommunityId, type AppVariables } from '../lib/session.js';

type Db = ReturnType<typeof ensureDatabaseReady>;

type RoundPresencePayload = {
  round: {
    id: string;
    status: string;
    theme: string | null;
    questions: string[];
    templateName: string | null;
    circleSize: number | null;
    durationMinutes: number | null;
  };
  slots: unknown;
  memberTimezone: string;
};

function roundQuestions(round: RoundDetailRow): string[] {
  return round.questions_json
    ? (JSON.parse(round.questions_json) as string[])
    : round.question
      ? [round.question]
      : [];
}

function buildRoundPresencePayload(
  db: Db,
  communityId: string,
  round: RoundDetailRow,
  memberTimezone: string,
  locale: 'pt' | 'en' = 'pt',
): RoundPresencePayload {
  const questions = roundQuestions(round);
  const items = parseRoundSlotsJson(round.slots_json);
  const template = round.template_id ? findTemplateById(db, round.template_id) : null;
  const slots =
    items.length === 0
      ? (() => {
          const fallback = listAllRegionalSlotOptions(db, communityId, memberTimezone, locale);
          return fallback.length ? fallback : ROUND_SLOTS;
        })()
      : items.some(
            (item) => isStoredRoundSlot(item) || (typeof item === 'string' && item.includes(':')),
          )
        ? resolveRoundSlotOptionsFromJson(db, communityId, round.slots_json, memberTimezone, locale)
        : (items as string[]);

  return {
    round: {
      id: round.id,
      status: round.status,
      theme: round.theme,
      questions,
      templateName: template?.name ?? null,
      circleSize: template?.circle_size ?? null,
      durationMinutes: template?.duration_minutes ?? null,
    },
    slots,
    memberTimezone,
  };
}

export function createRoundRoutes(db: Db) {
  const rounds = new Hono<{ Variables: AppVariables }>();
  const requireAuth = createRequireAuth(db);

  rounds.get('/open', requireAuth, (c) => {
    const communityId = resolveCommunityId(c, db);
    const userId = c.get('userId');
    if (!communityId) {
      return c.json({ error: { code: 'COMMUNITY_NOT_FOUND', message: 'Comunidade não encontrada' } }, 404);
    }

    const openRounds = listOpenRounds(db, communityId);
    const roundsPayload = openRounds.map((round) => {
      const template = round.template_id ? findTemplateById(db, round.template_id) : null;
      const declaration = getRoundDeclaration(db, round.id, userId);
      const responseStatus = !declaration
        ? ('none' as const)
        : declaration.response === 'declined'
          ? ('declined' as const)
          : ('attending' as const);
      return {
        id: round.id,
        status: round.status,
        theme: round.theme,
        questions: roundQuestions(round),
        createdAt: round.created_at,
        templateName: template?.name ?? null,
        circleSize: template?.circle_size ?? null,
        durationMinutes: template?.duration_minutes ?? null,
        responseStatus,
        declared: responseStatus === 'attending',
      };
    });

    return c.json({ rounds: roundsPayload });
  });

  rounds.get('/current', requireAuth, (c) => {
    const communityId = resolveCommunityId(c, db);
    if (!communityId) {
      return c.json({ error: { code: 'COMMUNITY_NOT_FOUND', message: 'Comunidade não encontrada' } }, 404);
    }
    const profile = getMemberProfile(db, communityId, c.get('userId'));
    const requestedTimezone = c.req.query('timezone')?.trim();
    const memberTimezone =
      requestedTimezone && requestedTimezone.length > 0
        ? requestedTimezone
        : (profile?.timezone ?? 'America/Sao_Paulo');
    const round = findOpenRound(db, communityId);
    if (!round) {
      const fallback = listAllRegionalSlotOptions(db, communityId, memberTimezone, 'pt');
      return c.json({ round: null, slots: fallback.length ? fallback : ROUND_SLOTS, memberTimezone });
    }
    return c.json(buildRoundPresencePayload(db, communityId, round, memberTimezone));
  });

  rounds.get('/:id', requireAuth, (c) => {
    const communityId = resolveCommunityId(c, db);
    const roundId = c.req.param('id');
    if (!communityId || !roundId) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Convite inválido' } }, 400);
    }

    const profile = getMemberProfile(db, communityId, c.get('userId'));
    const requestedTimezone = c.req.query('timezone')?.trim();
    const memberTimezone =
      requestedTimezone && requestedTimezone.length > 0
        ? requestedTimezone
        : (profile?.timezone ?? 'America/Sao_Paulo');

    const round = findRoundById(db, roundId);
    if (!round || round.community_id !== communityId || round.status !== 'open') {
      return c.json({ error: { code: 'ROUND_NOT_OPEN', message: 'Inscrições não estão abertas' } }, 404);
    }

    return c.json(buildRoundPresencePayload(db, communityId, round, memberTimezone));
  });

  rounds.post('/:id/presence', requireAuth, async (c) => {
    const userId = c.get('userId');
    const roundId = c.req.param('id');
    if (!roundId) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Convite inválido' } }, 400);
    }
    const round = findRoundById(db, roundId);
    if (!round || round.status !== 'open') {
      return c.json({ error: { code: 'ROUND_NOT_OPEN', message: 'Inscrições não estão abertas' } }, 404);
    }

    const communityId = resolveCommunityId(c, db);
    if (!communityId || round.community_id !== communityId) {
      return c.json({ error: { code: 'FORBIDDEN', message: 'Convite de outra comunidade' } }, 403);
    }

    const body = await c.req.json().catch(() => null);
    const parsed = presenceInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Presença inválida', details: parsed.error.issues } },
        400,
      );
    }

    const declaration = upsertRoundDeclaration(db, roundId, userId, parsed.data);
    if (parsed.data.timezone) {
      updateMemberTimezone(db, communityId, userId, parsed.data.timezone);
    }
    return c.json({
      roundId: declaration.round_id,
      response: declaration.response,
      slots: JSON.parse(declaration.slots_json),
      intention: declaration.intention === 'declined' ? null : declaration.intention,
    });
  });

  rounds.get('/:id/presence', requireAuth, (c) => {
    const userId = c.get('userId');
    const roundId = c.req.param('id');
    if (!roundId) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Convite inválido' } }, 400);
    }
    const declaration = getRoundDeclaration(db, roundId, userId);
    if (!declaration) {
      return c.json({ declaration: null });
    }
    return c.json({
      declaration: {
        roundId: declaration.round_id,
        response: declaration.response,
        slots: JSON.parse(declaration.slots_json),
        intention: declaration.intention === 'declined' ? null : declaration.intention,
      },
    });
  });

  return rounds;
}