import { describe, expect, it } from 'vitest';
import { isValidTrio, resolveCommonFacilitatorSlot, type MatchingMember } from './constraints.js';

const m = (
  userId: string,
  slots: MatchingMember['slots'],
  languages: MatchingMember['languages'],
): MatchingMember => ({
  userId,
  slots,
  languages,
  intention: 'surprise',
});

describe('matching constraints', () => {
  it('rejects trio without common language', () => {
    const trio = [
      m('a', ['mon-evening'], ['pt']),
      m('b', ['mon-evening'], ['en']),
      m('c', ['mon-evening'], ['en']),
    ];
    expect(isValidTrio(trio)).toBe(false);
  });

  it('rejects trio without slot overlap', () => {
    const trio = [
      m('a', ['mon-evening'], ['pt']),
      m('b', ['wed-evening'], ['pt']),
      m('c', ['sat-morning'], ['pt']),
    ];
    expect(isValidTrio(trio)).toBe(false);
  });

  it('accepts viable trio with regional slot refs', () => {
    const ref = 'cal-americas:slot-mon-1900';
    const trio = [m('a', [ref], ['pt']), m('b', [ref], ['pt']), m('c', [ref], ['pt', 'en'])];
    expect(isValidTrio(trio)).toBe(true);
    expect(resolveCommonFacilitatorSlot(trio)).toBe(ref);
  });
});
