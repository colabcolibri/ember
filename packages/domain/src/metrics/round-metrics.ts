export type RoundNoShowMetrics = {
  invited: number;
  responded: number;
  yes: number;
  no: number;
  rate: number | null;
};

export type RoundDiversityMetrics = {
  editionYears: number[];
  languages: string[];
  countries: string[];
};

export type RoundMetricsSnapshot = {
  newPairs: number;
  noShow: RoundNoShowMetrics;
  diversity: RoundDiversityMetrics;
  exceptions: {
    unmatched: number;
  };
};

export type RoundMetricsDelta = {
  newPairs: number;
  noShowRate: number | null;
};

export function computeNoShowRate(yes: number, no: number): number | null {
  const responded = yes + no;
  if (responded === 0) return null;
  return no / responded;
}

export function computeMetricDelta(
  current: RoundMetricsSnapshot,
  previous: RoundMetricsSnapshot,
): RoundMetricsDelta {
  const noShowRate =
    current.noShow.rate !== null && previous.noShow.rate !== null
      ? current.noShow.rate - previous.noShow.rate
      : null;

  return {
    newPairs: current.newPairs - previous.newPairs,
    noShowRate,
  };
}

export function uniqueSorted<T extends string | number>(values: T[]): T[] {
  return [...new Set(values)].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
}
