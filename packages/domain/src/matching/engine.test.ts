import { describe, expect, it } from 'vitest';
import {
  isValidTrio,
  resolveCommonFacilitatorSlot,
  type MatchingMember,
} from './constraints.js';
import { proposeTrios } from './engine.js';
import { pairKey, scoreTrio } from './scoring.js';

const m = (
  userId: string,
  slots: MatchingMember['slots'],
  languages: MatchingMember['languages'],
  intention: MatchingMember['intention'] = 'surprise',
): MatchingMember => ({ userId, slots, languages, intention });

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

  it('accepts viable trio', () => {
    const trio = [
      m('a', ['mon-evening'], ['pt', 'en']),
      m('b', ['mon-evening'], ['pt', 'en']),
      m('c', ['wed-evening', 'mon-evening'], ['pt']),
    ];
    expect(isValidTrio(trio)).toBe(true);
    expect(resolveCommonFacilitatorSlot(trio)).toBe('mon-19h');
  });
});

describe('matching engine', () => {
  it('prioritizes pairs without history', () => {
    const met = new Set([pairKey('a', 'b')]);
    const high = scoreTrio([m('a', ['mon-evening'], ['pt']), m('b', ['mon-evening'], ['pt']), m('c', ['mon-evening'], ['pt'])], met);
    const low = scoreTrio([m('a', ['mon-evening'], ['pt']), m('d', ['mon-evening'], ['pt']), m('e', ['mon-evening'], ['pt'])], met);
    expect(low).toBeGreaterThan(high);
  });

  it('forms trios from six members', () => {
    const members = [
      m('1', ['mon-evening'], ['pt']),
      m('2', ['mon-evening'], ['pt']),
      m('3', ['mon-evening'], ['pt']),
      m('4', ['wed-evening'], ['pt']),
      m('5', ['wed-evening'], ['pt']),
      m('6', ['wed-evening'], ['pt']),
    ];
    const trios = proposeTrios(members, new Set());
    expect(trios).toHaveLength(2);
    expect(trios[0]?.memberIds).toHaveLength(3);
  });
});
