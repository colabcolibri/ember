import { describe, expect, it } from 'vitest';
import { computeMetricDelta, computeNoShowRate } from './round-metrics.js';

describe('round metrics', () => {
  it('computes no-show rate from yes/no counts', () => {
    expect(computeNoShowRate(8, 2)).toBe(0.2);
    expect(computeNoShowRate(0, 0)).toBeNull();
  });

  it('computes deltas against previous round', () => {
    const current = {
      newPairs: 12,
      noShow: { invited: 10, responded: 10, yes: 8, no: 2, rate: 0.2 },
      diversity: { editionYears: [], languages: [], countries: [] },
      exceptions: { unmatched: 1 },
    };
    const previous = {
      newPairs: 9,
      noShow: { invited: 9, responded: 9, yes: 8, no: 1, rate: 1 / 9 },
      diversity: { editionYears: [], languages: [], countries: [] },
      exceptions: { unmatched: 0 },
    };
    const delta = computeMetricDelta(current, previous);
    expect(delta.newPairs).toBe(3);
    expect(delta.noShowRate).toBeCloseTo(0.2 - 1 / 9, 5);
  });
});
