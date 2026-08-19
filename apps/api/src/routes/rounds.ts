import { Hono } from 'hono';
import type { ensureDatabaseReady } from '@ember/db';
import {
  findOpenRound,
  findRoundById,
  getMemberProfile,
  getRoundDeclaration,
  listAllRegionalSlotOptions,
  resolveRoundSlotOptionsFromJson,
  updateMemberTimezone,
  upsertRoundDeclaration,
} from '@ember/db';
import { isStoredRoundSlot, parseRoundSlotsJson, presenceInputSchema, ROUND_SLOTS } from '@ember/domain';
import { createRequireAuth, resolveCommunityId, type AppVariables } from '../lib/session.js';

type Db = ReturnType<typeof ensureDatabaseReady>;

export function createRoundRoutes(db: Db) {
  const rounds = new Hono<{ Variables: AppVariables }>();
  const requireAuth = createRequireAuth(db);

  rounds.get('/current', requireAuth, (c) => {
    const communityId = resolveCommunityId(c, db);
    const userId = c.get('userId');
    if (!communityId) {
      return c.json({ error: { code: 'COMMUNITY_NOT_FOUND', message: 'Comunidade não encontrada' } }, 404);
    }
    const profile = getMemberProfile(db, communityId, userId);
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
    const questions = round.questions_json
      ? (JSON.parse(round.questions_json) as string[])
      : round.question
        ? [round.question]
        : [];
    const items = parseRoundSlotsJson(round.slots_json);
    const slots =
      items.length === 0
        ? (() => {
            const fallback = listAllRegionalSlotOptions(db, communityId, memberTimezone, 'pt');
            return fallback.length ? fallback : ROUND_SLOTS;
          })()
        : items.some(
              (item) =>
                isStoredRoundSlot(item) || (typeof item === 'string' && item.includes(':')),
            )
          ? resolveRoundSlotOptionsFromJson(
              db,
              communityId,
              round.slots_json,
              memberTimezone,
              'pt',
            )
          : (items as string[]);
    return c.json({
      round: {
        id: round.id,
        status: round.status,
        theme: round.theme,
        questions,
      },
      slots,
      memberTimezone,
    });
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
      slots: JSON.parse(declaration.slots_json),
      intention: declaration.intention,
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
        slots: JSON.parse(declaration.slots_json),
        intention: declaration.intention,
      },
    });
  });

  return rounds;
}
