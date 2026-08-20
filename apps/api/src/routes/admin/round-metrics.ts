import { Hono } from 'hono';
import type { ensureDatabaseReady } from '@ember/db';
import {
  findPreviousRoundId,
  findRoundById,
  loadRoundMetricsSnapshot,
} from '@ember/db';
import { computeMetricDelta } from '@ember/domain';
import { createRequireFacilitator, type FacilitatorVariables } from '../../lib/facilitator.js';

type Db = ReturnType<typeof ensureDatabaseReady>;

function requireRoundId(roundId: string | undefined): roundId is string {
  return Boolean(roundId?.trim());
}

export function createAdminRoundMetricsRoutes(db: Db) {
  const routes = new Hono<{ Variables: FacilitatorVariables }>();
  const requireFacilitator = createRequireFacilitator(db);
  routes.use('*', requireFacilitator);

  routes.get('/matching-rounds/:id/metrics', (c) => {
    const communityId = c.get('communityId');
    const roundId = c.req.param('id');
    if (!requireRoundId(roundId)) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Convite inválido' } }, 400);
    }

    const round = findRoundById(db, roundId);
    if (!round || round.community_id !== communityId) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Convite não encontrado' } }, 404);
    }

    const metrics = loadRoundMetricsSnapshot(db, communityId, roundId);
    const previousRoundId = findPreviousRoundId(db, communityId, roundId);
    const previous =
      previousRoundId !== null
        ? (() => {
            const previousMetrics = loadRoundMetricsSnapshot(db, communityId, previousRoundId);
            return {
              roundId: previousRoundId,
              metrics: previousMetrics,
              delta: computeMetricDelta(metrics, previousMetrics),
            };
          })()
        : null;

    return c.json({ roundId, metrics, previous });
  });

  return routes;
}
