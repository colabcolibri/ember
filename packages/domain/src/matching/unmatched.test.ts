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
});
