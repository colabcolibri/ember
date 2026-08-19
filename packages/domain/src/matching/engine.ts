import type { MatchingMember, TrioProposal } from './constraints.js';
import { isValidTrio, resolveCommonFacilitatorSlot } from './constraints.js';
import { scoreTrio } from './scoring.js';

export function proposeTrios(
  members: MatchingMember[],
  metPairs: Set<string>,
): TrioProposal[] {
  const pool = [...members].sort((a, b) => a.slots.length - b.slots.length);
  const proposals: TrioProposal[] = [];

  while (pool.length >= 3) {
    const anchor = pool.shift()!;
    let best: { idx: [number, number]; score: number; slot: string } | null = null;

    for (let i = 0; i < pool.length; i += 1) {
      for (let j = i + 1; j < pool.length; j += 1) {
        const trio = [anchor, pool[i]!, pool[j]!];
        if (!isValidTrio(trio)) continue;
        const slot = resolveCommonFacilitatorSlot(trio)!;
        const score = scoreTrio(trio, metPairs);
        if (!best || score > best.score) {
          best = { idx: [i, j], score, slot };
        }
      }
    }

    if (!best) break;

    const [i, j] = best.idx;
    const second = pool.splice(Math.max(i, j), 1)[0]!;
    const first = pool.splice(Math.min(i, j), 1)[0]!;
    proposals.push({
      memberIds: [anchor.userId, first.userId, second.userId],
      slot: best.slot,
      score: best.score,
    });
  }

  return proposals;
}
