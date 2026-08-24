import { describe, expect, it } from 'vitest';
import {
  isValidGroup,
  isValidTrio,
  resolveCommonFacilitatorSlot,
  type MatchingMember,
} from './constraints.js';
import { proposeGroups, proposeTrios } from './engine.js';
import { pairKey, scoreGroup, scoreTrio } from './scoring.js';

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

  it('accepts valid pair', () => {
    const pair = [m('a', ['mon-evening'], ['pt']), m('b', ['mon-evening'], ['pt'])];
    expect(isValidGroup(pair)).toBe(true);
  });
});

describe('matching engine', () => {
  it('prioritizes pairs without history', () => {
    const met = new Set([pairKey('a', 'b')]);
    const high = scoreGroup(
      [m('a', ['mon-evening'], ['pt']), m('b', ['mon-evening'], ['pt']), m('c', ['mon-evening'], ['pt'])],
      met,
    );
    const low = scoreGroup(
      [m('a', ['mon-evening'], ['pt']), m('d', ['mon-evening'], ['pt']), m('e', ['mon-evening'], ['pt'])],
      met,
    );
    expect(low).toBeGreaterThan(high);
    expect(scoreTrio).toBe(scoreGroup);
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
    const groups = proposeGroups(members, new Set());
    expect(groups).toHaveLength(2);
    expect(groups[0]?.memberIds).toHaveLength(3);
  });

  it('absorbs leftover member into quartet', () => {
    const members = [
      m('1', ['mon-evening'], ['pt']),
      m('2', ['mon-evening'], ['pt']),
      m('3', ['mon-evening'], ['pt']),
      m('4', ['mon-evening'], ['pt']),
    ];
    const groups = proposeGroups(members, new Set());
    expect(groups).toHaveLength(1);
    expect(groups[0]?.memberIds).toHaveLength(4);
  });

  it('forms pair when only two members remain', () => {
    const members = [m('1', ['mon-evening'], ['pt']), m('2', ['mon-evening'], ['pt'])];
    const groups = proposeGroups(members, new Set());
    expect(groups).toHaveLength(1);
    expect(groups[0]?.memberIds).toHaveLength(2);
  });

  it('prefers quartets when template size is four', () => {
    const members = [
      m('1', ['mon-evening'], ['pt']),
      m('2', ['mon-evening'], ['pt']),
      m('3', ['mon-evening'], ['pt']),
      m('4', ['mon-evening'], ['pt']),
    ];
    const groups = proposeGroups(members, new Set(), { preferredSize: 4 });
    expect(groups).toHaveLength(1);
    expect(groups[0]?.memberIds).toHaveLength(4);
  });

  it('places thirty-one compatible members using flexible group sizes', () => {
    const members = Array.from({ length: 31 }, (_, index) =>
      m(String(index + 1), ['mon-evening'], ['pt']),
    );
    const groups = proposeGroups(members, new Set(), { preferredSize: 4 });
    const matched = groups.reduce((total, group) => total + group.memberIds.length, 0);
    expect(matched).toBe(31);
  });

  it('keeps proposeTrios alias working', () => {
    const members = [
      m('1', ['mon-evening'], ['pt']),
      m('2', ['mon-evening'], ['pt']),
      m('3', ['mon-evening'], ['pt']),
    ];
    expect(proposeTrios(members, new Set())).toHaveLength(1);
  });
});
