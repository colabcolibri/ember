import { z } from 'zod';

export const regionalSlotRefSchema = z
  .string()
  .regex(/^[a-z0-9-]+:[a-z0-9-]+$/i, 'Referência de slot regional inválida');

export type RegionalSlotRef = z.infer<typeof regionalSlotRefSchema>;

export const slotCalendarEntrySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59).default(0),
  sortOrder: z.number().int().min(0).default(0),
});

export const slotCalendarSchema = z.object({
  label: z.string().trim().min(1).max(80),
  anchorTimezone: z.string().trim().min(1).max(64),
});

export const upsertSlotCalendarSchema = slotCalendarSchema.extend({
  entries: z.array(slotCalendarEntrySchema).min(1).max(20),
});

export type SlotCalendarEntryInput = z.infer<typeof slotCalendarEntrySchema>;
export type UpsertSlotCalendarInput = z.infer<typeof upsertSlotCalendarSchema>;

export function makeRegionalSlotRef(calendarId: string, entryId: string): RegionalSlotRef {
  return `${calendarId}:${entryId}` as RegionalSlotRef;
}

export function parseRegionalSlotRef(ref: string): { calendarId: string; entryId: string } | null {
  const idx = ref.indexOf(':');
  if (idx <= 0 || idx === ref.length - 1) return null;
  return { calendarId: ref.slice(0, idx), entryId: ref.slice(idx + 1) };
}
