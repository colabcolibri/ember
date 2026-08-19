import { AppCard } from './AppCard.js';
import { AppBadge } from './AppBadge.js';

export type TrioRow = {
  memberIds: [string, string, string];
  slot: string;
  score: number;
};

type TrioPreviewProps = {
  trios: TrioRow[];
  unmatched?: number;
  unmatchedLabel?: string;
};

export function TrioPreview({ trios, unmatched, unmatchedLabel }: TrioPreviewProps) {
  return (
    <div className="grid gap-3">
      {unmatched && unmatched > 0 && unmatchedLabel ? (
        <p className="text-sm text-muted-foreground">{unmatchedLabel}</p>
      ) : null}
      {trios.map((trio, idx) => (
        <AppCard key={idx} className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-2 px-6">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-[0.12em] text-primary uppercase">Trio {idx + 1}</p>
              <p className="mt-1 text-sm font-medium">{trio.memberIds.join(' · ')}</p>
              <p className="text-sm text-muted-foreground">{trio.slot}</p>
            </div>
            <AppBadge variant="muted">score {trio.score}</AppBadge>
          </div>
        </AppCard>
      ))}
    </div>
  );
}
