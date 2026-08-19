import { Hono } from 'hono';
import type { ensureDatabaseReady } from '@ember/db';
import {
  buildCircleIcs,
  countAttendanceResponses,
  getCircleForMember,
  listCircleMemberDetails,
  listMemberCircles,
  persistCircleParticipations,
  recordCircleAttendance,
  updateCircleMemberStatus,
} from '@ember/db';
import { attendanceInputSchema } from '@ember/domain';
import { requireEmailPepper } from '@ember/email';
import { createRequireAuth, resolveCommunityId, type AppVariables } from '../lib/session.js';

type Db = ReturnType<typeof ensureDatabaseReady>;

const ATTENDANCE_BUFFER_MS = 15 * 60 * 1000;

function isAttendanceWindowOpen(scheduledAt: string | null, durationMinutes: number): boolean {
  if (!scheduledAt) return false;
  const end = new Date(scheduledAt).getTime() + durationMinutes * 60 * 1000 + ATTENDANCE_BUFFER_MS;
  return Date.now() >= end;
}

export function createCircleRoutes(db: Db) {
  const circles = new Hono<{ Variables: AppVariables }>();
  const requireAuth = createRequireAuth(db);

  circles.get('/', requireAuth, (c) => {
    const userId = c.get('userId');
    const communityId = resolveCommunityId(c, db);
    if (!communityId) {
      return c.json({ error: { code: 'COMMUNITY_NOT_FOUND', message: 'Comunidade não encontrada' } }, 404);
    }
    const items = listMemberCircles(db, communityId, userId).map((circle) => ({
      id: circle.id,
      status: circle.status,
      question: circle.question,
      communityName: circle.community_name,
      scheduledSlot: circle.scheduled_slot,
      scheduledAt: circle.scheduled_at,
      jitsiUrl: circle.jitsi_url,
    }));
    return c.json({ circles: items });
  });

  circles.get('/:id', requireAuth, (c) => {
    const userId = c.get('userId');
    const circleId = c.req.param('id');
    if (!circleId) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Encontro inválido' } }, 400);
    }
    const circle = getCircleForMember(db, circleId, userId);
    if (!circle) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Encontro não encontrado' } }, 404);
    }
    const pepper = requireEmailPepper();
    const members = listCircleMemberDetails(db, circleId, pepper);
    const me = members.find((m) => m.userId === userId);
    const duration = circle.duration_minutes || 30;
    return c.json({
      circle: {
        id: circle.id,
        status: circle.status,
        question: circle.question,
        communityName: circle.community_name,
        scheduledSlot: circle.scheduled_slot,
        scheduledAt: circle.scheduled_at,
        jitsiUrl: circle.jitsi_url,
        durationMinutes: duration,
        canRecordAttendance: isAttendanceWindowOpen(circle.scheduled_at, duration),
        myStatus: me?.status ?? 'invited',
        myAttendance: me?.attendance ?? null,
      },
      members: members.map((m) => ({
        userId: m.userId,
        label: m.emailMasked,
        status: m.status,
        attendance: m.attendance,
      })),
    });
  });

  circles.get('/:id/calendar.ics', requireAuth, (c) => {
    const userId = c.get('userId');
    const circleId = c.req.param('id');
    if (!circleId) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Encontro inválido' } }, 400);
    }
    const circle = getCircleForMember(db, circleId, userId);
    if (!circle) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Encontro não encontrado' } }, 404);
    }
    const ics = buildCircleIcs(circle, circle.duration_minutes || 30);
    if (!ics) {
      return c.json({ error: { code: 'ICS_UNAVAILABLE', message: 'Agenda indisponível' } }, 404);
    }
    return c.body(ics, 200, {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ember-encontro.ics"',
    });
  });

  circles.post('/:id/confirm', requireAuth, (c) => {
    const userId = c.get('userId');
    const circleId = c.req.param('id');
    if (!circleId) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Encontro inválido' } }, 400);
    }
    const circle = getCircleForMember(db, circleId, userId);
    if (!circle) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Encontro não encontrado' } }, 404);
    }
    updateCircleMemberStatus(db, circleId, userId, 'confirmed');
    return c.json({ ok: true, status: 'confirmed' });
  });

  circles.post('/:id/decline', requireAuth, (c) => {
    const userId = c.get('userId');
    const circleId = c.req.param('id');
    if (!circleId) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Encontro inválido' } }, 400);
    }
    const circle = getCircleForMember(db, circleId, userId);
    if (!circle) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Encontro não encontrado' } }, 404);
    }
    updateCircleMemberStatus(db, circleId, userId, 'declined');
    return c.json({ ok: true, status: 'declined' });
  });

  circles.post('/:id/attendance', requireAuth, async (c) => {
    const userId = c.get('userId');
    const circleId = c.req.param('id');
    if (!circleId) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Encontro inválido' } }, 400);
    }
    const circle = getCircleForMember(db, circleId, userId);
    if (!circle) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Encontro não encontrado' } }, 404);
    }
    const duration = circle.duration_minutes || 30;
    if (!isAttendanceWindowOpen(circle.scheduled_at, duration)) {
      return c.json(
        { error: { code: 'ATTENDANCE_NOT_OPEN', message: 'Ainda não é hora de registrar o encontro' } },
        400,
      );
    }

    const body = await c.req.json().catch(() => null);
    const parsed = attendanceInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Resposta inválida', details: parsed.error.issues } },
        400,
      );
    }

    recordCircleAttendance(db, circleId, userId, parsed.data.happened);
    const responses = countAttendanceResponses(db, circleId);
    let participationsRecorded = 0;
    if (responses.yes === responses.total && responses.total >= 2) {
      participationsRecorded = persistCircleParticipations(
        db,
        circle.community_id,
        circleId,
        circle.scheduled_at ?? new Date().toISOString(),
      );
    }

    return c.json({
      ok: true,
      attendance: parsed.data.happened ? 'yes' : 'no',
      responses,
      participationsRecorded,
    });
  });

  return circles;
}
