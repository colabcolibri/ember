import { describe, expect, it } from 'vitest';
import type { MatchingMember } from './constraints.js';
import { analyzeUnmatched } from './unmatched.js';
import { proposeTrios } from './engine.js';

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
    const trios = proposeTrios(members, new Set());
    const unmatched = analyzeUnmatched(members, trios);
    expect(unmatched.some((row) => row.userId === 'c' && row.reasons.includes('INCOMPLETE_PROFILE'))).toBe(
      true,
    );
  });

  it('flags odd pool when count is not divisible by three', () => {
    const members = [baseMember('a'), baseMember('b'), baseMember('c'), baseMember('d')];
    const trios = proposeTrios(members, new Set());
    const unmatched = analyzeUnmatched(members, trios);
    expect(unmatched).toHaveLength(1);
    expect(unmatched[0]?.reasons).toContain('ODD_POOL');
  });
});
