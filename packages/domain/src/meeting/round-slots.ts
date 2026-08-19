import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { CreateRoundInput } from '../schemas/admin.js';

export const roundDateTimeSlotInputSchema = z.object({
  timezone: z.string().trim().min(1).max(64),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  localTime: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida'),
});

export type RoundDateTimeSlotInput = z.infer<typeof roundDateTimeSlotInputSchema>;

export type StoredRoundSlot = {
  ref: string;
  timezone: string;
  startsAt: string;
};

function getZonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour === '24' ? '0' : map.hour),
    minute: Number(map.minute),
  };
}

export function localDateTimeToUtc(
  timezone: string,
  localDate: string,
  localTime: string,
): Date {
  const [year, month, day] = localDate.split('-').map(Number);
  const [hour, minute] = localTime.split(':').map(Number);
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const parts = getZonedParts(guess, timezone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
  const target = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = asUtc - guess.getTime();
  return new Date(target - offset);
}

export function normalizeDateTimeSlotInput(input: RoundDateTimeSlotInput): StoredRoundSlot {
  const startsAt = localDateTimeToUtc(input.timezone, input.localDate, input.localTime);
  if (startsAt.getTime() <= Date.now()) {
    throw new Error('Slot deve ser no futuro');
  }
  return {
    ref: `dt:${randomUUID()}`,
    timezone: input.timezone,
    startsAt: startsAt.toISOString(),
  };
}

export function isStoredRoundSlot(value: unknown): value is StoredRoundSlot {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ref' in value &&
    'timezone' in value &&
    'startsAt' in value &&
    typeof (value as StoredRoundSlot).ref === 'string'
  );
}

export function parseRoundSlotsJson(raw: string | null): Array<string | StoredRoundSlot> {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => typeof item === 'string' || isStoredRoundSlot(item),
    ) as Array<string | StoredRoundSlot>;
  } catch {
    return [];
  }
}

export function formatDateTimeSlotOfficial(
  startsAt: Date,
  timezone: string,
  locale: 'pt' | 'en' = 'pt',
): string {
  const when = startsAt.toLocaleString(locale === 'pt' ? 'pt-BR' : 'en-US', {
    timeZone: timezone,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${when} (${timezone})`;
}

export function formatDateTimeSlotForMember(
  startsAt: Date,
  memberTimezone: string,
  locale: 'pt' | 'en' = 'pt',
): string {
  const when = startsAt.toLocaleString(locale === 'pt' ? 'pt-BR' : 'en-US', {
    timeZone: memberTimezone,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${when} (${memberTimezone})`;
}

export function findStoredRoundSlot(
  slots: Array<string | StoredRoundSlot>,
  ref: string,
): StoredRoundSlot | null {
  for (const item of slots) {
    if (isStoredRoundSlot(item) && item.ref === ref) return item;
  }
  return null;
}

export function normalizeCreateRoundSlots(
  slots: CreateRoundInput['slots'],
): Array<string | StoredRoundSlot> {
  return slots.map((slot) => {
    if (typeof slot === 'string') return slot;
    return normalizeDateTimeSlotInput(slot);
  });
}
