import { describe, expect, it } from 'vitest';
import {
  formatSlotForMember,
  formatSlotOfficial,
  resolveNextSlotDateTimeFromEntry,
} from './slot-calendars.js';

const americas = { id: 'cal-americas', label: 'Americas', anchorTimezone: 'America/Sao_Paulo' };
const europe = { id: 'cal-europe', label: 'Europe', anchorTimezone: 'Europe/Lisbon' };

describe('slot-calendars', () => {
  it('formats official label in anchor timezone context', () => {
    const label = formatSlotOfficial({ weekday: 0, hour: 13, minute: 0 }, europe, 'pt');
    expect(label).toContain('dom');
    expect(label).toContain('13:00');
    expect(label).toContain('Europe/Lisbon');
  });

  it('formats member label in member timezone', () => {
    const entry = { weekday: 0, hour: 14, minute: 0 };
    const local = formatSlotForMember(entry, americas, 'Europe/Lisbon', 'en');
    expect(local).toContain('Europe/Lisbon');
    expect(local).toMatch(/\d{2}:\d{2}/);
  });

  it('resolves next datetime for Americas sunday slot', () => {
    const from = new Date('2026-08-19T12:00:00.000Z');
    const next = resolveNextSlotDateTimeFromEntry(
      { weekday: 1, hour: 19, minute: 0 },
      americas.anchorTimezone,
      from,
    );
    expect(next.getTime()).toBeGreaterThan(from.getTime());
  });

  it('handles Europe vs Americas different wall clocks', () => {
    const from = new Date('2026-08-19T12:00:00.000Z');
    const sp = resolveNextSlotDateTimeFromEntry(
      { weekday: 0, hour: 14, minute: 0 },
      americas.anchorTimezone,
      from,
    );
    const lisbon = resolveNextSlotDateTimeFromEntry(
      { weekday: 0, hour: 13, minute: 0 },
      europe.anchorTimezone,
      from,
    );
    expect(sp.toISOString()).not.toBe(lisbon.toISOString());
  });
});
