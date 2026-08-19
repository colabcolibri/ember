import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import {
  formatDateTimeSlotForMember,
  formatDateTimeSlotOfficial,
  formatSlotForMember,
  formatSlotLocal,
  formatSlotOfficial,
  findStoredRoundSlot,
  isStoredRoundSlot,
  makeRegionalSlotRef,
  parseRegionalSlotRef,
  parseRoundSlotsJson,
  resolveNextSlotDateTime,
  resolveNextSlotDateTimeFromEntry,
  type StoredRoundSlot,
  type UpsertSlotCalendarInput,
} from '@ember/domain';

export type SlotCalendarRow = {
  id: string;
  community_id: string;
  label: string;
  anchor_timezone: string;
  created_at: string;
};

export type SlotCalendarEntryRow = {
  id: string;
  calendar_id: string;
  weekday: number;
  hour: number;
  minute: number;
  sort_order: number;
};

export type RegionalSlotOption = {
  ref: string;
  calendarId: string;
  calendarLabel: string;
  anchorTimezone: string;
  weekday: number;
  hour: number;
  minute: number;
  officialLabel: string;
  localLabel: string;
};

export function listSlotCalendars(
  db: Database.Database,
  communityId: string,
): Array<SlotCalendarRow & { entries: SlotCalendarEntryRow[] }> {
  const calendars = db
    .prepare(
      'SELECT id, community_id, label, anchor_timezone, created_at FROM slot_calendars WHERE community_id = ? ORDER BY label ASC',
    )
    .all(communityId) as SlotCalendarRow[];

  return calendars.map((calendar) => ({
    ...calendar,
    entries: db
      .prepare(
        'SELECT id, calendar_id, weekday, hour, minute, sort_order FROM slot_calendar_entries WHERE calendar_id = ? ORDER BY sort_order ASC',
      )
      .all(calendar.id) as SlotCalendarEntryRow[],
  }));
}

export function findSlotCalendarById(
  db: Database.Database,
  calendarId: string,
): SlotCalendarRow | null {
  return (
    (db
      .prepare(
        'SELECT id, community_id, label, anchor_timezone, created_at FROM slot_calendars WHERE id = ?',
      )
      .get(calendarId) as SlotCalendarRow | undefined) ?? null
  );
}

export function createSlotCalendar(
  db: Database.Database,
  communityId: string,
  input: UpsertSlotCalendarInput,
): SlotCalendarRow & { entries: SlotCalendarEntryRow[] } {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO slot_calendars (id, community_id, label, anchor_timezone, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, communityId, input.label, input.anchorTimezone, now);

  const entries = input.entries.map((entry, index) => {
    const entryId = randomUUID();
    db.prepare(
      'INSERT INTO slot_calendar_entries (id, calendar_id, weekday, hour, minute, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(
      entryId,
      id,
      entry.weekday,
      entry.hour,
      entry.minute,
      entry.sortOrder ?? index,
    );
    return {
      id: entryId,
      calendar_id: id,
      weekday: entry.weekday,
      hour: entry.hour,
      minute: entry.minute,
      sort_order: entry.sortOrder ?? index,
    };
  });

  return { id, community_id: communityId, label: input.label, anchor_timezone: input.anchorTimezone, created_at: now, entries };
}

export function updateSlotCalendar(
  db: Database.Database,
  calendarId: string,
  communityId: string,
  input: UpsertSlotCalendarInput,
): (SlotCalendarRow & { entries: SlotCalendarEntryRow[] }) | null {
  const existing = findSlotCalendarById(db, calendarId);
  if (!existing || existing.community_id !== communityId) return null;

  db.prepare('UPDATE slot_calendars SET label = ?, anchor_timezone = ? WHERE id = ?').run(
    input.label,
    input.anchorTimezone,
    calendarId,
  );
  db.prepare('DELETE FROM slot_calendar_entries WHERE calendar_id = ?').run(calendarId);

  const entries = input.entries.map((entry, index) => {
    const entryId = randomUUID();
    db.prepare(
      'INSERT INTO slot_calendar_entries (id, calendar_id, weekday, hour, minute, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(
      entryId,
      calendarId,
      entry.weekday,
      entry.hour,
      entry.minute,
      entry.sortOrder ?? index,
    );
    return {
      id: entryId,
      calendar_id: calendarId,
      weekday: entry.weekday,
      hour: entry.hour,
      minute: entry.minute,
      sort_order: entry.sortOrder ?? index,
    };
  });

  return {
    ...existing,
    label: input.label,
    anchor_timezone: input.anchorTimezone,
    entries,
  };
}

export function findSlotEntryByRef(
  db: Database.Database,
  ref: string,
): (SlotCalendarEntryRow & { calendar: SlotCalendarRow }) | null {
  const parsed = parseRegionalSlotRef(ref);
  if (!parsed) return null;
  const calendar = findSlotCalendarById(db, parsed.calendarId);
  if (!calendar) return null;
  const entry = db
    .prepare(
      'SELECT id, calendar_id, weekday, hour, minute, sort_order FROM slot_calendar_entries WHERE id = ? AND calendar_id = ?',
    )
    .get(parsed.entryId, parsed.calendarId) as SlotCalendarEntryRow | undefined;
  if (!entry) return null;
  return { ...entry, calendar };
}

export function resolveRoundSlotOptionsFromJson(
  db: Database.Database,
  communityId: string,
  slotsJson: string | null,
  memberTimezone: string,
  locale: 'pt' | 'en' = 'pt',
): RegionalSlotOption[] {
  const items = parseRoundSlotsJson(slotsJson);
  const options: RegionalSlotOption[] = [];

  for (const item of items) {
    if (isStoredRoundSlot(item)) {
      const startsAt = new Date(item.startsAt);
      options.push({
        ref: item.ref,
        calendarId: item.timezone,
        calendarLabel: item.timezone,
        anchorTimezone: item.timezone,
        weekday: startsAt.getUTCDay(),
        hour: startsAt.getUTCHours(),
        minute: startsAt.getUTCMinutes(),
        officialLabel: formatDateTimeSlotOfficial(startsAt, item.timezone, locale),
        localLabel: formatDateTimeSlotForMember(startsAt, memberTimezone, locale),
      });
      continue;
    }

    const fromCalendar = resolveRegionalSlotOptions(db, communityId, [item], memberTimezone, locale);
    options.push(...fromCalendar);
  }

  return options;
}

export function resolveRegionalSlotOptions(
  db: Database.Database,
  communityId: string,
  refs: string[],
  memberTimezone: string,
  locale: 'pt' | 'en' = 'pt',
): RegionalSlotOption[] {
  const options: RegionalSlotOption[] = [];
  for (const ref of refs) {
    const resolved = findSlotEntryByRef(db, ref);
    if (!resolved || resolved.calendar.community_id !== communityId) continue;
    const entry = {
      weekday: resolved.weekday,
      hour: resolved.hour,
      minute: resolved.minute,
    };
    const calendar = {
      id: resolved.calendar.id,
      label: resolved.calendar.label,
      anchorTimezone: resolved.calendar.anchor_timezone,
    };
    options.push({
      ref,
      calendarId: calendar.id,
      calendarLabel: calendar.label,
      anchorTimezone: calendar.anchorTimezone,
      weekday: entry.weekday,
      hour: entry.hour,
      minute: entry.minute,
      officialLabel: formatSlotOfficial(entry, calendar, locale),
      localLabel: formatSlotForMember(entry, calendar, memberTimezone, locale),
    });
  }
  return options;
}

export function listAllRegionalSlotOptions(
  db: Database.Database,
  communityId: string,
  memberTimezone: string,
  locale: 'pt' | 'en' = 'pt',
): RegionalSlotOption[] {
  const calendars = listSlotCalendars(db, communityId);
  const refs = calendars.flatMap((calendar) =>
    calendar.entries.map((entry) => makeRegionalSlotRef(calendar.id, entry.id)),
  );
  return resolveRegionalSlotOptions(db, communityId, refs, memberTimezone, locale);
}

export function validateRegionalSlotRefs(
  db: Database.Database,
  communityId: string,
  refs: string[],
): boolean {
  if (refs.length === 0) return false;
  return refs.every((ref) => {
    const resolved = findSlotEntryByRef(db, ref);
    return Boolean(resolved && resolved.calendar.community_id === communityId);
  });
}

export function formatRoundSlotOfficialLabels(
  db: Database.Database,
  communityId: string,
  slots: Array<string | StoredRoundSlot>,
  locale: 'pt' | 'en' = 'pt',
): string[] {
  const labels: string[] = [];

  for (const item of slots) {
    if (isStoredRoundSlot(item)) {
      const startsAt = new Date(item.startsAt);
      labels.push(formatDateTimeSlotOfficial(startsAt, item.timezone, locale));
      continue;
    }

    if (item.includes(':')) {
      const [option] = resolveRegionalSlotOptions(db, communityId, [item], 'UTC', locale);
      if (option) {
        labels.push(option.officialLabel);
        continue;
      }
    }

    const when = resolveNextSlotDateTime(item);
    labels.push(
      formatSlotLocal(item, when, locale),
    );
  }

  return labels;
}

export function resolveScheduledAtForSlot(
  db: Database.Database,
  slotRef: string,
  from: Date = new Date(),
  roundSlotsJson?: string | null,
): string {
  if (slotRef.startsWith('dt:') && roundSlotsJson) {
    const stored = findStoredRoundSlot(parseRoundSlotsJson(roundSlotsJson), slotRef);
    if (stored) return stored.startsAt;
  }

  const regional = findSlotEntryByRef(db, slotRef);
  if (regional) {
    return resolveNextSlotDateTimeFromEntry(
      {
        weekday: regional.weekday,
        hour: regional.hour,
        minute: regional.minute,
      },
      regional.calendar.anchor_timezone,
      from,
    ).toISOString();
  }
  return resolveNextSlotDateTime(slotRef, from).toISOString();
}
