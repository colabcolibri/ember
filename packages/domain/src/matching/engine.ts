import type { MatchingMember } from './constraints.js';
import { isValidGroup, resolveCommonFacilitatorSlot } from './constraints.js';
import type { GroupProposal } from './constraints.js';
import { scoreGroup } from './scoring.js';

function pickBestGroup(
  pool: MatchingMember[],
  size: number,
  metPairs: Set<string>,
): { members: MatchingMember[]; score: number; slot: string } | null {
  if (pool.length < size) return null;

  let best: { members: MatchingMember[]; score: number; slot: string } | null = null;

  const visit = (start: number, picked: MatchingMember[], depth: number) => {
    if (depth === size) {
      if (!isValidGroup(picked)) return;
      const slot = resolveCommonFacilitatorSlot(picked)!;
      const score = scoreGroup(picked, metPairs);
      if (!best || score > best.score) {
        best = { members: [...picked], score, slot };
      }
      return;
    }
    for (let i = start; i <= pool.length - (size - depth); i += 1) {
      picked.push(pool[i]!);
      visit(i + 1, picked, depth + 1);
      picked.pop();
    }
  };

  visit(0, [], 0);
  return best;
}

function removeMembers(pool: MatchingMember[], remove: MatchingMember[]): MatchingMember[] {
  const ids = new Set(remove.map((member) => member.userId));
  return pool.filter((member) => !ids.has(member.userId));
}

export function proposeGroups(
  members: MatchingMember[],
  metPairs: Set<string>,
): GroupProposal[] {
  let pool = [...members].sort((a, b) => a.slots.length - b.slots.length);
  const proposals: GroupProposal[] = [];

  while (pool.length >= 3) {
    const trio = pickBestGroup(pool, 3, metPairs);
    if (!trio) break;
    proposals.push({
      memberIds: trio.members.map((member) => member.userId),
      slot: trio.slot,
      score: trio.score,
    });
    pool = removeMembers(pool, trio.members);
  }

  if (pool.length === 1 && proposals.length > 0) {
    const solo = pool[0]!;
    for (let index = 0; index < proposals.length; index += 1) {
      const proposal = proposals[index]!;
      if (proposal.memberIds.length !== 3) continue;
      const trioMembers = proposal.memberIds
        .map((id) => members.find((member) => member.userId === id))
        .filter(Boolean) as MatchingMember[];
      const quartet = [...trioMembers, solo];
      if (!isValidGroup(quartet)) continue;
      const slot = resolveCommonFacilitatorSlot(quartet)!;
      proposals[index] = {
        memberIds: quartet.map((member) => member.userId),
        slot,
        score: scoreGroup(quartet, metPairs),
      };
      pool = [];
      break;
    }
  }

  if (pool.length === 2) {
    const pair = pickBestGroup(pool, 2, metPairs);
    if (pair) {
      proposals.push({
        memberIds: pair.members.map((member) => member.userId),
        slot: pair.slot,
        score: pair.score,
      });
      pool = [];
    }
  }

  if (pool.length === 4) {
    const quartet = pickBestGroup(pool, 4, metPairs);
    if (quartet) {
      proposals.push({
        memberIds: quartet.members.map((member) => member.userId),
        slot: quartet.slot,
        score: quartet.score,
      });
      pool = [];
    } else {
      const trio = pickBestGroup(pool, 3, metPairs);
      if (trio) {
        proposals.push({
          memberIds: trio.members.map((member) => member.userId),
          slot: trio.slot,
          score: trio.score,
        });
        pool = removeMembers(pool, trio.members);
      }
    }
  }

  return proposals;
}

/** @deprecated use proposeGroups */
export function proposeTrios(members: MatchingMember[], metPairs: Set<string>): GroupProposal[] {
  return proposeGroups(members, metPairs);
}
