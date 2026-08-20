import type { GroupProposal, MatchingMember } from './constraints.js';
import { proposeGroups } from './engine.js';
import { analyzeUnmatched, countUnmatched, type UnmatchedMember } from './unmatched.js';

export type MatchRunResult = {
  groups: GroupProposal[];
  /** @deprecated use groups */
  trios: GroupProposal[];
  unmatched: number;
  unmatchedMembers: UnmatchedMember[];
};

export function runMatchingEngine(
  members: MatchingMember[],
  metPairs: Set<string>,
): MatchRunResult {
  const groups = proposeGroups(members, metPairs);
  const unmatchedMembers = analyzeUnmatched(members, groups);
  return {
    groups,
    trios: groups,
    unmatched: countUnmatched(members, groups),
    unmatchedMembers,
  };
}
