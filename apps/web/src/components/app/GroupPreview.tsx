import { useTranslation } from 'react-i18next';
import { AppBadge } from './AppBadge.js';

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
  memberLabels?: Record<string, string>;
};

function groupSizeLabel(size: number, t: (key: string, options?: Record<string, unknown>) => string): string {
  if (size === 2) return t('facilitator.groupSize.pair');
  if (size === 4) return t('facilitator.groupSize.quartet');
  return t('facilitator.groupSize.trio');
}

function memberNames(
  memberIds: string[],
  memberLabels: Record<string, string>,
): string {
  return memberIds.map((id) => memberLabels[id] ?? id).join(' · ');
}

export function GroupPreview({
  groups,
  trios,
  unmatched,
  unmatchedLabel,
  slotLabels = {},
  memberLabels = {},
}: GroupPreviewProps) {
  const { t } = useTranslation();
  const rows = groups.length > 0 ? groups : (trios ?? []);

  return (
    <div className="grid gap-3">
      {rows.length > 0 ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{t('facilitator.groupScoreHint')}</p>
      ) : null}
      {unmatched && unmatched > 0 && unmatchedLabel ? (
        <p className="text-sm text-muted-foreground">{unmatchedLabel}</p>
      ) : null}
      {rows.map((group, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-outline-variant/30 bg-muted/5 px-4 py-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-[0.12em] text-primary uppercase">
                {t('facilitator.groupLabel', { index: idx + 1 })} · {groupSizeLabel(group.memberIds.length, t)}
              </p>
              <p className="mt-1 wrap-break-word text-sm font-medium text-foreground">
                {memberNames(group.memberIds, memberLabels)}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {slotLabels[group.slot] ?? group.slot}
              </p>
            </div>
            <AppBadge variant="muted" title={t('facilitator.groupScoreHint')}>
              {t('facilitator.groupScore', { score: group.score })}
            </AppBadge>
          </div>
        </div>
      ))}
    </div>
  );
}

/** @deprecated use GroupPreview */
export function TrioPreview(props: Omit<GroupPreviewProps, 'groups'> & { trios: MatchGroupRow[] }) {
  return <GroupPreview groups={props.trios} {...props} />;
}

export function buildMemberLabelMap(
  declarations: Array<{ userId: string; memberLabel: string }>,
): Record<string, string> {
  return Object.fromEntries(declarations.map((item) => [item.userId, item.memberLabel]));
}
