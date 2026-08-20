import { useTranslation } from 'react-i18next';
import { AppBadge } from './AppBadge.js';
import { AppCard } from './AppCard.js';

export type MatchGroupRow = {
  memberIds: string[];
  slot: string;
  score: number;
};

/** @deprecated use MatchGroupRow */
export type TrioRow = MatchGroupRow & {
  memberIds: [string, string, string];
};

type GroupPreviewProps = {
  groups: MatchGroupRow[];
  /** @deprecated use groups */
  trios?: MatchGroupRow[];
  unmatched?: number;
  unmatchedLabel?: string;
  slotLabels?: Record<string, string>;
};

function groupSizeLabel(size: number, t: (key: string, options?: Record<string, unknown>) => string): string {
  if (size === 2) return t('facilitator.groupSize.pair');
  if (size === 4) return t('facilitator.groupSize.quartet');
  return t('facilitator.groupSize.trio');
}

export function GroupPreview({
  groups,
  trios,
  unmatched,
  unmatchedLabel,
  slotLabels = {},
}: GroupPreviewProps) {
  const { t } = useTranslation();
  const rows = groups.length > 0 ? groups : (trios ?? []);

  return (
    <div className="grid gap-3">
      {unmatched && unmatched > 0 && unmatchedLabel ? (
        <p className="text-sm text-muted-foreground">{unmatchedLabel}</p>
      ) : null}
      {rows.map((group, idx) => (
        <AppCard key={idx} className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-2 px-6">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-[0.12em] text-primary uppercase">
                {t('facilitator.groupLabel', { index: idx + 1 })} · {groupSizeLabel(group.memberIds.length, t)}
              </p>
              <p className="mt-1 wrap-break-word text-sm font-medium">{group.memberIds.join(' · ')}</p>
              <p className="text-sm text-muted-foreground">{slotLabels[group.slot] ?? group.slot}</p>
            </div>
            <AppBadge variant="muted">score {group.score}</AppBadge>
          </div>
        </AppCard>
      ))}
    </div>
  );
}

/** @deprecated use GroupPreview */
export function TrioPreview(props: Omit<GroupPreviewProps, 'groups'> & { trios: MatchGroupRow[] }) {
  return <GroupPreview groups={props.trios} {...props} />;
}
