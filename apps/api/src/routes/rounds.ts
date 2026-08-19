import { Hono } from 'hono';
import type { ensureDatabaseReady } from '@ember/db';
import { presenceInputSchema, ROUND_SLOTS } from '@ember/domain';
import {
  findOpenRound,
  findRoundById,
  getRoundDeclaration,
  upsertRoundDeclaration,
} from '@ember/db';
import { createRequireAuth, resolveCommunityId, type AppVariables } from '../lib/session.js';

type Db = ReturnType<typeof ensureDatabaseReady>;

export function createRoundRoutes(db: Db) {
  const rounds = new Hono<{ Variables: AppVariables }>();
  const requireAuth = createRequireAuth(db);

  rounds.get('/current', requireAuth, (c) => {
    const communityId = resolveCommunityId(c, db);
    if (!communityId) {
      return c.json({ error: { code: 'COMMUNITY_NOT_FOUND', message: 'Comunidade não encontrada' } }, 404);
    }
    const round = findOpenRound(db, communityId);
    if (!round) {
      return c.json({ round: null, slots: ROUND_SLOTS });
    }
    const questions = round.questions_json
      ? (JSON.parse(round.questions_json) as string[])
      : round.question
        ? [round.question]
        : [];
    return c.json({
      round: {
        id: round.id,
        status: round.status,
        theme: round.theme,
        questions,
      },
      slots: round.slots_json ? (JSON.parse(round.slots_json) as string[]) : ROUND_SLOTS,
    });
  });

  rounds.post('/:id/presence', requireAuth, async (c) => {
    const userId = c.get('userId');
    const roundId = c.req.param('id');
    if (!roundId) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Rodada inválida' } }, 400);
    }
    const round = findRoundById(db, roundId);
    if (!round || round.status !== 'open') {
      return c.json({ error: { code: 'ROUND_NOT_OPEN', message: 'Rodada não está aberta' } }, 404);
    }

    const communityId = resolveCommunityId(c, db);
    if (!communityId || round.community_id !== communityId) {
      return c.json({ error: { code: 'FORBIDDEN', message: 'Rodada de outra comunidade' } }, 403);
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
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Rodada inválida' } }, 400);
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
