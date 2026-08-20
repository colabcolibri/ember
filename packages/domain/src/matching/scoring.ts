import type { MatchingMember } from './constraints.js';

export function pairKey(a: string, b: string): string {
  return [a, b].sort().join(':');
}

export function scoreGroup(members: MatchingMember[], metPairs: Set<string>): number {
  let score = 0;
  for (let i = 0; i < members.length; i += 1) {
    for (let j = i + 1; j < members.length; j += 1) {
      const key = pairKey(members[i]!.userId, members[j]!.userId);
      score += metPairs.has(key) ? 1 : 10;
    }
  }
  const intentions = new Set(members.map((m) => m.intention));
  if (intentions.has('frontier') && intentions.has('surprise')) {
    score += 3;
  }
  return score;
}

/** @deprecated use scoreGroup */
export const scoreTrio = scoreGroup;
