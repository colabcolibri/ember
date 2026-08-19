import { Hono } from 'hono';
import type { ensureDatabaseReady } from '@ember/db';
import {
  createMatchingRound,
  findDefaultTemplateForCommunity,
  findRoundById,
  findTemplateById,
  createMeetingTemplate,
  listMeetingTemplates,
  listCircleMembers,
  listCirclesForRound,
  listRoundDeclarations,
  loadMatchingMembers,
  loadMetPairs,
  publishTriosWithDelivery,
  updateMeetingTemplate,
} from '@ember/db';
import {
  createRoundSchema,
  meetingTemplateSchema,
  normalizeCreateRoundSlots,
  proposeTrios,
  publishTriosSchema,
  type CreateRoundInput,
  type TrioProposal,
} from '@ember/domain';
import { createRequireFacilitator, type FacilitatorVariables } from '../../lib/facilitator.js';
import { requireEmailPepper } from '@ember/email';
import {
  sendCircleFormedNotifications,
  sendRoundOpenNotifications,
} from '../../services/circle-notifications.js';
import { createAdminSlotCalendarRoutes, validateRoundSlotRefs } from './slot-calendars.js';

type Db = ReturnType<typeof ensureDatabaseReady>;

function requireRoundId(roundId: string | undefined): roundId is string {
  return Boolean(roundId?.trim());
}

function requireTemplateId(templateId: string | undefined): templateId is string {
  return Boolean(templateId?.trim());
}

export function createAdminRoundRoutes(db: Db) {
  const routes = new Hono<{ Variables: FacilitatorVariables }>();
  const requireFacilitator = createRequireFacilitator(db);

  routes.post('/matching-rounds', requireFacilitator, async (c) => {
    const communityId = c.get('communityId');
    const body = await c.req.json().catch(() => null);
    const parsed = createRoundSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Convite inválido', details: parsed.error.issues } },
        400,
      );
    }

    const templateId =
      parsed.data.templateId ??
      findDefaultTemplateForCommunity(db, communityId)?.id ??
      null;
    if (!templateId) {
      return c.json(
        { error: { code: 'TEMPLATE_NOT_FOUND', message: 'Template de encontro não encontrado' } },
        404,
      );
    }
    const template = findTemplateById(db, templateId);
    if (!template || template.community_id !== communityId) {
      return c.json(
        { error: { code: 'TEMPLATE_NOT_FOUND', message: 'Template de encontro não encontrado' } },
        404,
      );
    }

    if (!validateRoundSlotRefs(db, communityId, parsed.data.slots)) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Horários inválidos para o encontro' } },
        400,
      );
    }

    let normalizedSlots;
    try {
      normalizedSlots = normalizeCreateRoundSlots(parsed.data.slots);
    } catch (err) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: err instanceof Error ? err.message : 'Horários inválidos para o encontro',
          },
        },
        400,
      );
    }

    const round = createMatchingRound(
      db,
      communityId,
      { ...parsed.data, slots: normalizedSlots as CreateRoundInput['slots'] },
      templateId,
    );
    await sendRoundOpenNotifications(db, {
      communityId,
      roundId: round.id,
      theme: parsed.data.theme,
      questions: parsed.data.questions,
      slots: normalizedSlots,
    });
    return c.json(
      {
        round: {
          id: round.id,
          status: round.status,
          theme: round.theme,
          questions: round.questions_json ? JSON.parse(round.questions_json) : [],
          question: round.question,
          slots: round.slots_json ? JSON.parse(round.slots_json) : [],
          templateId: round.template_id,
        },
      },
      201,
    );
  });

  routes.get('/matching-rounds/:id', requireFacilitator, (c) => {
    const communityId = c.get('communityId');
    const roundId = c.req.param('id');
    if (!requireRoundId(roundId)) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Convite inválido' } }, 400);
    }
    const round = findRoundById(db, roundId);
    if (!round || round.community_id !== communityId) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Convite não encontrado' } }, 404);
    }

    const circles = listCirclesForRound(db, roundId).map((circle) => ({
      id: circle.id,
      status: circle.status,
      scheduledSlot: circle.scheduled_slot,
      members: listCircleMembers(db, circle.id),
    }));

    return c.json({
      round: {
        id: round.id,
        status: round.status,
        theme: round.theme,
        questions: round.questions_json ? JSON.parse(round.questions_json) : [],
        question: round.question,
        slots: round.slots_json ? JSON.parse(round.slots_json) : [],
        templateId: round.template_id,
      },
      circles,
    });
  });

  routes.get('/matching-rounds/:id/declarations', requireFacilitator, (c) => {
    const communityId = c.get('communityId');
    const roundId = c.req.param('id');
    if (!requireRoundId(roundId)) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Convite inválido' } }, 400);
    }
    const round = findRoundById(db, roundId);
    if (!round || round.community_id !== communityId) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Convite não encontrado' } }, 404);
    }

    const page = Math.max(1, Number(c.req.query('page') ?? 1));
    const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') ?? 20)));
    const pepper = requireEmailPepper();
    const { items, total } = listRoundDeclarations(db, roundId, page, limit, pepper);

    return c.json({
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  });

  routes.post('/matching-rounds/:id/match', requireFacilitator, (c) => {
    const communityId = c.get('communityId');
    const roundId = c.req.param('id');
    if (!requireRoundId(roundId)) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Convite inválido' } }, 400);
    }
    const round = findRoundById(db, roundId);
    if (!round || round.community_id !== communityId) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Convite não encontrado' } }, 404);
    }
    if (round.status !== 'open') {
      return c.json({ error: { code: 'ROUND_NOT_OPEN', message: 'Inscrições não estão abertas' } }, 400);
    }

    const members = loadMatchingMembers(db, communityId, roundId);
    if (members.length < 3) {
      return c.json(
        { error: { code: 'NOT_ENOUGH_MEMBERS', message: 'Pelo menos 3 inscritos são necessários' } },
        400,
      );
    }

    const metPairs = loadMetPairs(db, communityId);
    const trios: TrioProposal[] = proposeTrios(members, metPairs);
    const unmatched = members.length - trios.length * 3;

    return c.json({ trios, unmatched });
  });

  routes.post('/matching-rounds/:id/publish', requireFacilitator, async (c) => {
    const communityId = c.get('communityId');
    const roundId = c.req.param('id');
    if (!requireRoundId(roundId)) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Convite inválido' } }, 400);
    }
    const round = findRoundById(db, roundId);
    if (!round || round.community_id !== communityId) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Convite não encontrado' } }, 404);
    }
    if (round.status === 'published') {
      return c.json({ error: { code: 'ALREADY_PUBLISHED', message: 'Círculos já publicados' } }, 400);
    }

    const body = await c.req.json().catch(() => null);
    const parsed = publishTriosSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Trios inválidos', details: parsed.error.issues } },
        400,
      );
    }

    const circles = publishTriosWithDelivery(
      db,
      roundId,
      parsed.data.trios.map((trio) => ({ ...trio, score: trio.score ?? 0 })),
      process.env.EMBER_JITSI_BASE_URL,
    );
    await sendCircleFormedNotifications(db, {
      communityId,
      roundId,
      question: round.question ?? '',
      circles,
    });
    return c.json({
      roundId,
      status: 'published',
      circles: circles.map((circle) => ({
        id: circle.id,
        status: circle.status,
        scheduledSlot: circle.scheduled_slot,
        jitsiUrl: circle.jitsi_url,
        scheduledAt: circle.scheduled_at,
      })),
    });
  });

  return routes;
}

export function createAdminTemplateRoutes(db: Db) {
  const routes = new Hono<{ Variables: FacilitatorVariables }>();
  const requireFacilitator = createRequireFacilitator(db);

  function mapTemplate(template: NonNullable<ReturnType<typeof findTemplateById>>) {
    return {
      id: template.id,
      name: template.name,
      circleSize: template.circle_size,
      durationMinutes: template.duration_minutes,
    };
  }

  routes.get('/templates', requireFacilitator, (c) => {
    const communityId = c.get('communityId');
    const templates = listMeetingTemplates(db, communityId).map(mapTemplate);
    return c.json({ templates });
  });

  routes.post('/templates', requireFacilitator, async (c) => {
    const communityId = c.get('communityId');
    const body = await c.req.json().catch(() => null);
    const parsed = meetingTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Template inválido', details: parsed.error.issues } },
        400,
      );
    }
    const created = createMeetingTemplate(db, communityId, parsed.data);
    return c.json({ template: mapTemplate(created) }, 201);
  });

  routes.get('/templates/:id', requireFacilitator, (c) => {
    const communityId = c.get('communityId');
    const templateId = c.req.param('id');
    if (!requireTemplateId(templateId)) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Template inválido' } }, 400);
    }
    const template = findTemplateById(db, templateId);
    if (!template || template.community_id !== communityId) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Template não encontrado' } }, 404);
    }
    return c.json({
      template: mapTemplate(template),
    });
  });

  routes.put('/templates/:id', requireFacilitator, async (c) => {
    const communityId = c.get('communityId');
    const templateId = c.req.param('id');
    if (!requireTemplateId(templateId)) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Template inválido' } }, 400);
    }
    const existing = findTemplateById(db, templateId);
    if (!existing || existing.community_id !== communityId) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Template não encontrado' } }, 404);
    }

    const body = await c.req.json().catch(() => null);
    const parsed = meetingTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Template inválido', details: parsed.error.issues } },
        400,
      );
    }

    const updated = updateMeetingTemplate(db, templateId, parsed.data)!;
    return c.json({
      template: mapTemplate(updated),
    });
  });

  return routes;
}

export function createAdminRoutes(db: Db) {
  const admin = new Hono();
  admin.route('/', createAdminRoundRoutes(db));
  admin.route('/', createAdminTemplateRoutes(db));
  admin.route('/', createAdminSlotCalendarRoutes(db));
  return admin;
}
