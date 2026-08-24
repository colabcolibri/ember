import { describe, expect, it } from 'vitest';
import type { MatchingMember } from './constraints.js';
import { analyzeUnmatched, countUnmatched } from './unmatched.js';
import { proposeGroups } from './engine.js';

const baseMember = (userId: string, overrides: Partial<MatchingMember> = {}): MatchingMember => ({
  userId,
  slots: ['mon-evening'],
  languages: ['pt'],
  intention: 'surprise',
  ...overrides,
});

describe('analyzeUnmatched', () => {
  it('flags incomplete profile when languages are missing', () => {
    const members = [
      baseMember('a'),
      baseMember('b'),
      baseMember('c', { languages: [] }),
    ];
    const groups = proposeGroups(members, new Set());
    const unmatched = analyzeUnmatched(members, groups);
    expect(unmatched.some((row) => row.userId === 'c' && row.reasons.includes('INCOMPLETE_PROFILE'))).toBe(
      true,
    );
  });

  it('matches four compatible members without leftovers', () => {
    const members = [
      baseMember('a'),
      baseMember('b'),
      baseMember('c'),
      baseMember('d'),
    ];
    const groups = proposeGroups(members, new Set());
    expect(countUnmatched(members, groups)).toBe(0);
  });

  it('labels multiple compatible leftovers as not placed', () => {
    const members = [
      baseMember('a'),
      baseMember('b'),
      baseMember('c'),
      baseMember('d'),
      baseMember('e'),
    ];
    const groups = [{ memberIds: ['a', 'b', 'c'], slot: 'mon-evening', score: 30 }];
    const unmatched = analyzeUnmatched(members, groups);
    expect(unmatched).toHaveLength(2);
    for (const row of unmatched) {
      expect(row.reasons).toContain('NOT_PLACED');
      expect(row.reasons).not.toContain('ODD_POOL');
    }
  });

  it('uses odd pool only for a single compatible leftover', () => {
    const members = [
      baseMember('a'),
      baseMember('b'),
      baseMember('c'),
      baseMember('d'),
    ];
    const groups = [{ memberIds: ['a', 'b', 'c'], slot: 'mon-evening', score: 30 }];
    const unmatched = analyzeUnmatched(members, groups);
    expect(unmatched).toHaveLength(1);
    expect(unmatched[0]?.reasons).toContain('ODD_POOL');
  });
});
