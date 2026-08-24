import { useTranslation } from 'react-i18next';
import { AppBadge } from './AppBadge.js';
import { AppButton } from './AppButton.js';
import { AppCard } from './AppCard.js';
import { cn } from '@/lib/utils';

export type UnmatchedReason =
  | 'INCOMPLETE_PROFILE'
  | 'NO_COMMON_LANGUAGE'
  | 'NO_COMMON_SLOT'
  | 'ODD_POOL'
  | 'NOT_PLACED';

export type UnmatchedMemberRow = {
  userId: string;
  memberLabel: string;
  reasons: UnmatchedReason[];
};

type UnmatchedPanelProps = {
  items: UnmatchedMemberRow[];
  loading?: boolean;
  onExport?: () => void;
  variant?: 'card' | 'section';
  className?: string;
};

export function UnmatchedPanel({
  items,
  loading,
  onExport,
  variant = 'card',
  className,
}: UnmatchedPanelProps) {
  const { t } = useTranslation();

  if (items.length === 0) return null;

  const content = (
    <>
      <p className="mb-4 text-sm text-muted-foreground">{t('facilitator.unmatchedSectionHint')}</p>
      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.userId}
            className="flex flex-col gap-2 rounded-xl border border-outline-variant/60 bg-muted/10 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <p className="min-w-0 font-medium text-foreground">{item.memberLabel}</p>
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
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <AppButton
          variant="outline"
          className="w-full sm:w-auto"
          loading={loading}
          onClick={onExport}
          disabled={!onExport}
        >
          {t('facilitator.exportUnmatchedCsv')}
        </AppButton>
        <p className="text-xs text-muted-foreground">{t('facilitator.unmatchedExportHint')}</p>
      </div>
    </>
  );

  if (variant === 'section') {
    return (
      <section className={cn('border-t border-outline-variant/20 pt-5', className)}>
        <h3 className="mb-1 font-serif text-lg text-foreground">
          {t('facilitator.unmatchedSectionTitle', { count: items.length })}
        </h3>
        {content}
      </section>
    );
  }

  return (
    <AppCard
      title={t('facilitator.unmatchedSectionTitle', { count: items.length })}
      className={className}
    >
      {content}
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
