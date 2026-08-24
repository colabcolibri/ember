import type { MatchingMember } from './constraints.js';
import { isValidGroup, resolveCommonFacilitatorSlot } from './constraints.js';
import type { GroupProposal } from './constraints.js';
import { scoreGroup } from './scoring.js';

export type ProposeGroupsOptions = {
  preferredSize?: 2 | 3 | 4;
};

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

function normalizePreferredSize(size: number | undefined): 2 | 3 | 4 {
  if (size === 2 || size === 4) return size;
  return 3;
}

function sizePriority(preferred: 2 | 3 | 4, poolLength: number): number[] {
  const order = [preferred, 4, 3, 2];
  const seen = new Set<number>();
  return order.filter((size) => {
    if (size > poolLength || size < 2 || seen.has(size)) return false;
    seen.add(size);
    return true;
  });
}

function tryAbsorbSoloIntoTrio(
  pool: MatchingMember[],
  proposals: GroupProposal[],
  members: MatchingMember[],
  metPairs: Set<string>,
): MatchingMember[] {
  if (pool.length !== 1 || proposals.length === 0) return pool;

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
    return [];
  }

  return pool;
}

export function proposeGroups(
  members: MatchingMember[],
  metPairs: Set<string>,
  options: ProposeGroupsOptions = {},
): GroupProposal[] {
  const preferred = normalizePreferredSize(options.preferredSize);
  let pool = [...members].sort((a, b) => a.slots.length - b.slots.length);
  const proposals: GroupProposal[] = [];

  const pickAndCommit = (size: number): boolean => {
    const picked = pickBestGroup(pool, size, metPairs);
    if (!picked) return false;
    proposals.push({
      memberIds: picked.members.map((member) => member.userId),
      slot: picked.slot,
      score: picked.score,
    });
    pool = removeMembers(pool, picked.members);
    return true;
  };

  while (pool.length >= preferred) {
    if (pickAndCommit(preferred)) continue;
    const fallbacks = sizePriority(preferred, pool.length).filter((size) => size !== preferred);
    let placed = false;
    for (const size of fallbacks) {
      if (pickAndCommit(size)) {
        placed = true;
        break;
      }
    }
    if (!placed) break;
  }

  pool = tryAbsorbSoloIntoTrio(pool, proposals, members, metPairs);

  let progress = true;
  while (progress && pool.length >= 2) {
    progress = false;
    for (const size of sizePriority(preferred, pool.length)) {
      if (pickAndCommit(size)) {
        progress = true;
        break;
      }
    }
  }

  return proposals;
}

/** @deprecated use proposeGroups */
export function proposeTrios(
  members: MatchingMember[],
  metPairs: Set<string>,
  options: ProposeGroupsOptions = {},
): GroupProposal[] {
  return proposeGroups(members, metPairs, options);
}
