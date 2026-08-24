import type { GroupProposal, MatchingMember } from './constraints.js';
import { proposeGroups, type ProposeGroupsOptions } from './engine.js';
import { analyzeUnmatched, countUnmatched, type UnmatchedMember } from './unmatched.js';

export type MatchingEngineOptions = ProposeGroupsOptions;

export type MatchRunResult = {
  groups: GroupProposal[];
  /** @deprecated use groups */
  trios: GroupProposal[];
  unmatched: number;
  unmatchedMembers: UnmatchedMember[];
};

export function matchingOptionsFromCircleSize(
  circleSize: number | null | undefined,
): MatchingEngineOptions {
  if (circleSize === 2 || circleSize === 3 || circleSize === 4) {
    return { preferredSize: circleSize };
  }
  return {};
}

export function runMatchingEngine(
  members: MatchingMember[],
  metPairs: Set<string>,
  options: MatchingEngineOptions = {},
): MatchRunResult {
  const groups = proposeGroups(members, metPairs, options);
  const unmatchedMembers = analyzeUnmatched(members, groups);
  return {
    groups,
    trios: groups,
    unmatched: countUnmatched(members, groups),
    unmatchedMembers,
  };
}
