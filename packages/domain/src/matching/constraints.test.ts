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

  it('accepts viable trio with mapped facilitator slot', () => {
    const trio = [
      m('a', ['mon-evening'], ['pt', 'en']),
      m('b', ['mon-evening'], ['pt', 'en']),
      m('c', ['wed-evening', 'mon-evening'], ['pt']),
    ];
    expect(isValidTrio(trio)).toBe(true);
    expect(resolveCommonFacilitatorSlot(trio)).toBe('mon-19h');
  });
});
