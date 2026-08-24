import type { GroupProposal, MatchingMember } from './constraints.js';
import { groupHasCommonLanguage, isValidGroup } from './constraints.js';

export type UnmatchedReason =
  | 'INCOMPLETE_PROFILE'
  | 'NO_COMMON_LANGUAGE'
  | 'NO_COMMON_SLOT'
  | 'ODD_POOL'
  | 'NOT_PLACED';

export type UnmatchedMember = {
  userId: string;
  reasons: UnmatchedReason[];
};

function canMemberJoinAnyGroup(member: MatchingMember, members: MatchingMember[]): boolean {
  for (let size = 2; size <= 4; size += 1) {
    if (members.length < size) continue;
    const others = members.filter((row) => row.userId !== member.userId);
    const visit = (start: number, picked: MatchingMember[], depth: number): boolean => {
      if (depth === size - 1) {
        return isValidGroup([member, ...picked]);
      }
      for (let i = start; i <= others.length - (size - 1 - depth); i += 1) {
        if (visit(i + 1, [...picked, others[i]!], depth + 1)) return true;
      }
      return false;
    };
    if (visit(0, [], 0)) return true;
  }
  return false;
}

export function analyzeUnmatched(
  members: MatchingMember[],
  groups: GroupProposal[],
): UnmatchedMember[] {
  const matched = new Set(groups.flatMap((group) => group.memberIds));
  const unmatchedMembers = members.filter((member) => !matched.has(member.userId));

  return unmatchedMembers.map((member) => {
    const reasons: UnmatchedReason[] = [];

    if (!member.languages.length) {
      reasons.push('INCOMPLETE_PROFILE');
    }

    let hasLanguageOverlap = false;
    for (const other of members) {
      if (other.userId === member.userId) continue;
      if (groupHasCommonLanguage([member, other])) {
        hasLanguageOverlap = true;
        break;
      }
    }

    const canJoin = canMemberJoinAnyGroup(member, members);

    if (!canJoin && member.languages.length > 0) {
      if (!hasLanguageOverlap) {
        reasons.push('NO_COMMON_LANGUAGE');
      } else {
        reasons.push('NO_COMMON_SLOT');
      }
    }

    if (canJoin) {
      if (unmatchedMembers.length === 1) {
        reasons.push('ODD_POOL');
      } else {
        reasons.push('NOT_PLACED');
      }
    }

    if (reasons.length === 0) {
      reasons.push('NOT_PLACED');
    }

    return { userId: member.userId, reasons: [...new Set(reasons)] };
  });
}

export function countUnmatched(members: MatchingMember[], groups: GroupProposal[]): number {
  const matched = new Set(groups.flatMap((group) => group.memberIds));
  return members.length - matched.size;
}
