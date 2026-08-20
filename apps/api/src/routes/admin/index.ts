import { Hono } from 'hono';
import type { ensureDatabaseReady } from '@ember/db';
import {
  createMatchingRound,
  findDefaultTemplateForCommunity,
  findOpenRound,
  findRoundById,
  findTemplateById,
  createMeetingTemplate,
  listMeetingTemplates,
  listCircleMembers,
  listCirclesForRound,
  listRoundDeclarations,
  listMatchingRounds,
  loadMatchingMembers,
  loadMetPairs,
  publishTriosWithDelivery,
  resolveRoundSlotOptionsFromJson,
  scheduleCircleReminderJobs,
  updateMeetingTemplate,
  type MatchingRoundListItem,
} from '@ember/db';
import {
  createRoundSchema,
  meetingTemplateSchema,
  normalizeCreateRoundSlots,
  parseRoundSlotsJson,
  publishTriosSchema,
  runMatchingEngine,
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
import { createAdminBrandingRoutes } from './branding.js';
import { createAdminMembersRoutes } from './members.js';
import {
  createAdminMatchingAutomationRoutes,
  recordPublishAudit,
} from './matching-automation.js';

type Db = ReturnType<typeof ensureDatabaseReady>;

function requireRoundId(roundId: string | undefined): roundId is string {
  return Boolean(roundId?.trim());
}

function requireTemplateId(templateId: string | undefined): templateId is string {
  return Boolean(templateId?.trim());
}

function parseRoundQuestions(round: {
  questions_json: string | null;
  question: string | null;
}): string[] {
  if (round.questions_json) {
    return JSON.parse(round.questions_json) as string[];
  }
  return round.question ? [round.question] : [];
}

function buildSlotPreview(
  db: Db,
  communityId: string,
  slotsJson: string | null,
): { slotCount: number; slotPreview: string[]; slotLabels: Record<string, string> } {
  if (!slotsJson) {
    return { slotCount: 0, slotPreview: [], slotLabels: {} };
  }

  const items = parseRoundSlotsJson(slotsJson);
  const slotOptions = resolveRoundSlotOptionsFromJson(db, communityId, slotsJson, 'America/Sao_Paulo', 'pt');
  const labels =
    slotOptions.length > 0
      ? slotOptions.map((slot) => slot.officialLabel)
      : items.map((item) => (typeof item === 'string' ? item : item.ref ?? String(item)));

  return {
    slotCount: items.length,
    slotPreview: labels.slice(0, 4),
    slotLabels: Object.fromEntries(
      slotOptions.length > 0
        ? slotOptions.map((slot) => [slot.ref, slot.officialLabel])
        : labels.map((label, index) => [`slot-${index}`, label]),
    ),
  };
}

function mapGatheringSummary(db: Db, communityId: string, row: MatchingRoundListItem) {
  const questions = row.questionsJson
    ? (JSON.parse(row.questionsJson) as string[])
    : row.question
      ? [row.question]
      : [];
  const slots = buildSlotPreview(db, communityId, row.slotsJson);

  return {
    id: row.id,
    status: row.status,
    theme: row.theme,
    questions,
    createdAt: row.createdAt,
    declarationCount: row.declarationCount,
    templateName: row.templateName,
    circleSize: row.circleSize,
    durationMinutes: row.durationMinutes,
    slotCount: slots.slotCount,
    slotPreview: slots.slotPreview,
    circleCount: row.circleCount,
  };
}

function mapGatheringDetail(
  db: Db,
  communityId: string,
  round: NonNullable<ReturnType<typeof findRoundById>>,
  declarationCount: number,
  circleCount: number,
) {
  const questions = parseRoundQuestions(round);
  const slots = buildSlotPreview(db, communityId, round.slots_json);
  const template = round.template_id ? findTemplateById(db, round.template_id) : null;

  return {
    id: round.id,
    status: round.status,
    theme: round.theme,
    questions,
    createdAt: round.created_at,
    declarationCount,
    templateName: template?.name ?? null,
    circleSize: template?.circle_size ?? null,
    durationMinutes: template?.duration_minutes ?? null,
    slotCount: slots.slotCount,
    slotPreview: slots.slotPreview,
    circleCount,
    slotLabels: slots.slotLabels,
  };
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

  routes.get('/matching-rounds', requireFacilitator, (c) => {
    const communityId = c.get('communityId');
    const rounds = listMatchingRounds(db, communityId).map((row) =>
      mapGatheringSummary(db, communityId, row),
    );
    return c.json({ rounds });
  });

  routes.get('/matching-rounds/current', requireFacilitator, (c) => {
    const communityId = c.get('communityId');
    const round = findOpenRound(db, communityId);
    if (!round) {
      return c.json({ round: null, declarationCount: 0 });
    }

    const pepper = requireEmailPepper();
    const { total } = listRoundDeclarations(db, round.id, 1, 1, pepper);
    const questions = round.questions_json
      ? (JSON.parse(round.questions_json) as string[])
      : round.question
        ? [round.question]
        : [];

    const slotOptions = round.slots_json
      ? resolveRoundSlotOptionsFromJson(db, communityId, round.slots_json, 'America/Sao_Paulo', 'pt')
      : [];
    const slotLabels = Object.fromEntries(slotOptions.map((slot) => [slot.ref, slot.officialLabel]));

    return c.json({
      round: {
        id: round.id,
        status: round.status,
        theme: round.theme,
        questions,
        slotLabels,
      },
      declarationCount: total,
    });
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

    const pepper = requireEmailPepper();
    const { total } = listRoundDeclarations(db, roundId, 1, 1, pepper);
    const circles = listCirclesForRound(db, roundId).map((circle) => ({
      id: circle.id,
      status: circle.status,
      scheduledSlot: circle.scheduled_slot,
      members: listCircleMembers(db, circle.id),
    }));

    return c.json({
      round: mapGatheringDetail(db, communityId, round, total, circles.length),
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
    const result = runMatchingEngine(members, metPairs);

    return c.json({
      trios: result.trios,
      unmatched: result.unmatched,
      unmatchedMembers: result.unmatchedMembers,
    });
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
      return c.json({ error: { code: 'ALREADY_PUBLISHED', message: 'Encontros já publicados' } }, 400);
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
    const emails = await sendCircleFormedNotifications(db, {
      communityId,
      roundId,
      question: round.question ?? '',
      circles,
    });
    scheduleCircleReminderJobs(db, circles);
    recordPublishAudit(db, {
      roundId,
      actorUserId: c.get('userId'),
      circleCount: circles.length,
      emailsSent: emails.sent,
      emailsFailed: emails.failed.length,
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
      emails,
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
  admin.route('/', createAdminBrandingRoutes(db));
  admin.route('/', createAdminMembersRoutes(db));
  admin.route('/', createAdminMatchingAutomationRoutes(db));
  return admin;
}
