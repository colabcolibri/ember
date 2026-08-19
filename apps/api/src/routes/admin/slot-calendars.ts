import { Hono } from 'hono';
import type { ensureDatabaseReady } from '@ember/db';
import {
  createSlotCalendar,
  listSlotCalendars,
  updateSlotCalendar,
  validateRegionalSlotRefs,
} from '@ember/db';
import { formatSlotOfficial, roundDateTimeSlotInputSchema, upsertSlotCalendarSchema } from '@ember/domain';
import type { CreateRoundInput } from '@ember/domain';
import { createRequireFacilitator, type FacilitatorVariables } from '../../lib/facilitator.js';

type Db = ReturnType<typeof ensureDatabaseReady>;

function mapCalendar(
  calendar: ReturnType<typeof listSlotCalendars>[number],
) {
  return {
    id: calendar.id,
    label: calendar.label,
    anchorTimezone: calendar.anchor_timezone,
    entries: calendar.entries.map((entry) => ({
      id: entry.id,
      ref: `${calendar.id}:${entry.id}`,
      weekday: entry.weekday,
      hour: entry.hour,
      minute: entry.minute,
      sortOrder: entry.sort_order,
      officialLabel: formatSlotOfficial(
        { weekday: entry.weekday, hour: entry.hour, minute: entry.minute },
        {
          id: calendar.id,
          label: calendar.label,
          anchorTimezone: calendar.anchor_timezone,
        },
        'pt',
      ),
    })),
  };
}

export function createAdminSlotCalendarRoutes(db: Db) {
  const routes = new Hono<{ Variables: FacilitatorVariables }>();
  const requireFacilitator = createRequireFacilitator(db);

  routes.get('/slot-calendars', requireFacilitator, (c) => {
    const communityId = c.get('communityId');
    const calendars = listSlotCalendars(db, communityId).map(mapCalendar);
    return c.json({ calendars });
  });

  routes.post('/slot-calendars', requireFacilitator, async (c) => {
    const communityId = c.get('communityId');
    const body = await c.req.json().catch(() => null);
    const parsed = upsertSlotCalendarSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Calendário inválido', details: parsed.error.issues } },
        400,
      );
    }
    const created = createSlotCalendar(db, communityId, parsed.data);
    return c.json({ calendar: mapCalendar(created) }, 201);
  });

  routes.put('/slot-calendars/:id', requireFacilitator, async (c) => {
    const communityId = c.get('communityId');
    const calendarId = c.req.param('id');
    const body = await c.req.json().catch(() => null);
    const parsed = upsertSlotCalendarSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Calendário inválido', details: parsed.error.issues } },
        400,
      );
    }
    const updated = updateSlotCalendar(db, calendarId, communityId, parsed.data);
    if (!updated) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Calendário não encontrado' } }, 404);
    }
    return c.json({ calendar: mapCalendar(updated) });
  });

  return routes;
}

export function validateRoundSlotRefs(
  db: Db,
  communityId: string,
  slots: CreateRoundInput['slots'],
): boolean {
  if (slots.length === 0) return false;

  const datetimeSlots = slots.filter((slot) => typeof slot === 'object');
  const stringSlots = slots.filter((slot) => typeof slot === 'string') as string[];

  for (const slot of datetimeSlots) {
    if (!roundDateTimeSlotInputSchema.safeParse(slot).success) return false;
  }

  const regional = stringSlots.filter((slot) => slot.includes(':'));
  const legacy = stringSlots.filter((slot) => !slot.includes(':'));

  if (legacy.length > 0 && (regional.length > 0 || datetimeSlots.length > 0)) return false;
  if (regional.length > 0 && !validateRegionalSlotRefs(db, communityId, regional)) return false;

  return datetimeSlots.length > 0 || regional.length > 0 || legacy.length > 0;
}
