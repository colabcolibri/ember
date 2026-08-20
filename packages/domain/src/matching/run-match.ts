import type { MatchingMember, TrioProposal } from './constraints.js';
import { proposeTrios } from './engine.js';
import { analyzeUnmatched, countUnmatched, type UnmatchedMember } from './unmatched.js';

export type MatchRunResult = {
  trios: TrioProposal[];
  unmatched: number;
  unmatchedMembers: UnmatchedMember[];
};

export function runMatchingEngine(
  members: MatchingMember[],
  metPairs: Set<string>,
): MatchRunResult {
  const trios = proposeTrios(members, metPairs);
  const unmatchedMembers = analyzeUnmatched(members, trios);
  return {
    trios,
    unmatched: countUnmatched(members, trios),
    unmatchedMembers,
  };
}
