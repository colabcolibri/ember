import { useTranslation } from 'react-i18next';
import { AppBadge } from './AppBadge.js';
import { AppButton } from './AppButton.js';
import { AppCard } from './AppCard.js';

export type UnmatchedReason =
  | 'INCOMPLETE_PROFILE'
  | 'NO_COMMON_LANGUAGE'
  | 'NO_COMMON_SLOT'
  | 'ODD_POOL';

export type UnmatchedMemberRow = {
  userId: string;
  memberLabel: string;
  reasons: UnmatchedReason[];
};

type UnmatchedPanelProps = {
  items: UnmatchedMemberRow[];
  roundId: string;
  loading?: boolean;
  onExport?: () => void;
};

export function UnmatchedPanel({ items, roundId, loading, onExport }: UnmatchedPanelProps) {
  const { t } = useTranslation();

  if (items.length === 0) return null;

  return (
    <AppCard title={t('facilitator.unmatchedSectionTitle', { count: items.length })} className="lg:col-span-12">
      <p className="mb-4 text-sm text-muted-foreground">{t('facilitator.unmatchedSectionHint')}</p>
      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.userId}
            className="flex flex-col gap-2 rounded-xl border border-outline-variant/60 bg-muted/10 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium">{item.memberLabel}</p>
              <p className="text-xs text-muted-foreground">{item.userId}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.reasons.map((reason) => (
                <AppBadge key={reason} variant="muted">
                  {t(`facilitator.unmatchedReason.${reason}`)}
                </AppBadge>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <AppButton
          variant="outline"
          className="w-full sm:w-auto"
          loading={loading}
          onClick={onExport}
          disabled={!onExport}
        >
          {t('facilitator.exportUnmatchedCsv')}
        </AppButton>
        <p className="self-center text-xs text-muted-foreground">
          {t('facilitator.unmatchedExportHint', { roundId })}
        </p>
      </div>
    </AppCard>
  );
}

export function buildUnmatchedRows(
  unmatchedMembers: Array<{ userId: string; reasons: UnmatchedReason[] }>,
  declarations: Array<{ userId: string; memberLabel: string }>,
): UnmatchedMemberRow[] {
  const labelByUser = new Map(declarations.map((item) => [item.userId, item.memberLabel]));
  return unmatchedMembers.map((item) => ({
    userId: item.userId,
    memberLabel: labelByUser.get(item.userId) ?? item.userId,
    reasons: item.reasons,
  }));
}
