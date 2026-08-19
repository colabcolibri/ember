import { describe, expect, it } from 'vitest';
import {
  formatDateTimeSlotForMember,
  formatDateTimeSlotOfficial,
  localDateTimeToUtc,
  normalizeDateTimeSlotInput,
} from './round-slots.js';

describe('round-slots', () => {
  it('converts local date/time in timezone to utc', () => {
    const utc = localDateTimeToUtc('America/Sao_Paulo', '2026-12-01', '19:00');
    expect(utc.toISOString()).toMatch(/T22:00:00/);
  });

  it('normalizes datetime slot input with ref', () => {
    const slot = normalizeDateTimeSlotInput({
      timezone: 'Europe/Lisbon',
      localDate: '2026-12-15',
      localTime: '13:00',
    });
    expect(slot.ref).toMatch(/^dt:/);
    expect(slot.timezone).toBe('Europe/Lisbon');
    expect(slot.startsAt).toBeTruthy();
  });

  it('formats official and member labels from startsAt', () => {
    const startsAt = new Date('2026-08-24T17:00:00.000Z');
    const official = formatDateTimeSlotOfficial(startsAt, 'America/Sao_Paulo', 'pt');
    const local = formatDateTimeSlotForMember(startsAt, 'Europe/Lisbon', 'pt');
    expect(official).toContain('America/Sao_Paulo');
    expect(local).toContain('Europe/Lisbon');
  });
});
