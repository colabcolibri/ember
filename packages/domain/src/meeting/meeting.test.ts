import { describe, expect, it } from 'vitest';
import { buildIcsEvent } from './ics.js';
import { buildJitsiRoomUrl } from './jitsi.js';
import { formatSlotLocal, resolveNextSlotDateTime } from './slots.js';

describe('jitsi', () => {
  it('builds stable non-guessable room url', () => {
    const url = buildJitsiRoomUrl('circle-abc', 'https://meet.jit.si');
    expect(url).toMatch(/^https:\/\/meet\.jit\.si\/ember-/);
    expect(buildJitsiRoomUrl('circle-abc', 'https://meet.jit.si')).toBe(url);
    expect(buildJitsiRoomUrl('circle-xyz', 'https://meet.jit.si')).not.toBe(url);
  });
});

describe('slots', () => {
  it('resolves next monday 19h from wednesday', () => {
    const from = new Date('2026-08-19T12:00:00.000Z');
    const when = resolveNextSlotDateTime('mon-19h', from);
    expect(when.getUTCDay()).toBe(1);
    expect(formatSlotLocal('mon-19h', when, 'pt')).toContain('19:00');
  });
});

describe('ics', () => {
  it('builds valid ics document', () => {
    const start = new Date('2026-08-25T22:00:00.000Z');
    const end = new Date('2026-08-25T22:30:00.000Z');
    const ics = buildIcsEvent({
      uid: 'circle@test',
      title: 'Ember — Fogo de Conselho',
      description: 'Pergunta piloto',
      location: 'https://meet.jit.si/ember-test',
      start,
      end,
      url: 'https://meet.jit.si/ember-test',
    });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('DTSTART:20260825T220000Z');
    expect(ics).toContain('DTEND:20260825T223000Z');
  });
});
