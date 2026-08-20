import type { MatchingMember, TrioProposal } from './constraints.js';
import { isValidTrio, trioHasCommonLanguage } from './constraints.js';

export type UnmatchedReason =
  | 'INCOMPLETE_PROFILE'
  | 'NO_COMMON_LANGUAGE'
  | 'NO_COMMON_SLOT'
  | 'ODD_POOL';

export type UnmatchedMember = {
  userId: string;
  reasons: UnmatchedReason[];
};

export function analyzeUnmatched(
  members: MatchingMember[],
  trios: TrioProposal[],
): UnmatchedMember[] {
  const matched = new Set(trios.flatMap((trio) => trio.memberIds));
  const unmatchedMembers = members.filter((member) => !matched.has(member.userId));
  const oddPool = members.length % 3 !== 0;

  return unmatchedMembers.map((member) => {
    const reasons: UnmatchedReason[] = [];

    if (!member.languages.length) {
      reasons.push('INCOMPLETE_PROFILE');
    }

    let canFormValidTrio = false;
    let hasLanguageOverlap = false;

    for (let i = 0; i < members.length; i += 1) {
      for (let j = i + 1; j < members.length; j += 1) {
        const a = members[i]!;
        const b = members[j]!;
        if (a.userId === member.userId || b.userId === member.userId) continue;
        const trio = [member, a, b];
        if (trioHasCommonLanguage(trio)) {
          hasLanguageOverlap = true;
        }
        if (isValidTrio(trio)) {
          canFormValidTrio = true;
          break;
        }
      }
      if (canFormValidTrio) break;
    }

    if (!canFormValidTrio && member.languages.length > 0) {
      if (!hasLanguageOverlap) {
        reasons.push('NO_COMMON_LANGUAGE');
      } else {
        reasons.push('NO_COMMON_SLOT');
      }
    }

    if (oddPool && unmatchedMembers.length <= 2) {
      reasons.push('ODD_POOL');
    }

    if (reasons.length === 0) {
      reasons.push('ODD_POOL');
    }

    return { userId: member.userId, reasons: [...new Set(reasons)] };
  });
}

export function countUnmatched(members: MatchingMember[], trios: TrioProposal[]): number {
  return members.length - trios.length * 3;
}
