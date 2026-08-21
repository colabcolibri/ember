import type { GatheringSummary } from '@/lib/gathering.js';
import { formatGatheringDate, gatheringTitle } from '@/lib/gathering.js';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AppBadge } from './AppBadge.js';
import { GatheringDateLine } from './GatheringDateLine.js';
import { GatheringMetaChips } from './GatheringMetaChips.js';

type GatheringListRowProps = {
  gathering: GatheringSummary;
  statusLabel: string;
  statusTone?: 'open' | 'confirmed' | 'declined';
  to?: string;
  className?: string;
};

export function GatheringListRow({
  gathering,
  statusLabel,
  statusTone = 'open',
  to,
  className,
}: GatheringListRowProps) {
  const { t, i18n } = useTranslation();
  const isOpen = gathering.status === 'open';
  const badgeVariant =
    statusTone === 'confirmed' ? 'rust' : statusTone === 'declined' ? 'muted' : isOpen ? 'rust' : 'muted';
  const title = gatheringTitle(gathering, t('facilitator.untitledGathering'));

  const slotItems =
    gathering.slotPreview.length > 0
      ? gathering.slotPreview.map((slot, index) => ({
          icon: 'schedule',
          label: slot,
          key: `slot-${gathering.id}-${index}`,
        }))
      : gathering.slotCount > 0
        ? [
            {
              icon: 'schedule',
              label: t('facilitator.gatheringSlotsMeta', { count: gathering.slotCount }),
            },
          ]
        : [];

  const openedOnLabel = t('facilitator.gatheringOpenedOn', {
    date: formatGatheringDate(gathering.createdAt, i18n.language),
  });

  const metaItems = [
    gathering.createdByDisplayName
      ? {
          icon: 'person',
          label: t('facilitator.gatheringCreatedBy', { name: gathering.createdByDisplayName }),
        }
      : null,
    gathering.templateName
      ? {
          icon: 'local_fire_department',
          label: t('facilitator.gatheringTemplateMeta', {
            name: gathering.templateName,
            size: gathering.circleSize ?? '—',
            minutes: gathering.durationMinutes ?? '—',
          }),
        }
      : null,
    {
      icon: 'quiz',
      label: t('facilitator.gatheringQuestionsMeta', { count: gathering.questions.length }),
    },
    ...slotItems,
    {
      icon: 'group',
      label: t('facilitator.confirmedCount', { count: gathering.declarationCount }),
    },
    gathering.circleCount > 0
      ? {
          icon: 'hub',
          label: t('facilitator.gatheringCirclesMeta', { count: gathering.circleCount }),
        }
      : null,
  ].filter(Boolean) as Array<{ icon: string; label: string; key?: string }>;

  return (
    <Link
      to={to ?? `/facilitator/gatherings/${gathering.id}`}
      className={cn(
        'group relative block min-w-0 overflow-hidden rounded-card border bg-paper p-5 shadow-sm transition-colors sm:p-6',
        isOpen ? 'border-primary/30 hover:border-primary/50' : 'border-outline-variant/30 hover:border-primary/30',
        className,
      )}
    >
      <div className="ember-card-gradient pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 grid min-w-0 gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <AppBadge variant={badgeVariant}>{statusLabel}</AppBadge>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                {t('facilitator.theme')}
              </p>
              <p className="font-serif text-xl leading-snug font-medium text-foreground group-hover:text-primary sm:text-2xl">
                {title}
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined shrink-0 text-primary opacity-60 transition-opacity group-hover:opacity-100">
            arrow_forward
          </span>
        </div>

        {gathering.questions.length > 0 ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {gathering.questions[0]}
            {gathering.questions.length > 1
              ? ` · ${t('facilitator.gatheringMoreQuestions', { count: gathering.questions.length - 1 })}`
              : null}
          </p>
        ) : null}

        <div className="grid min-w-0 gap-3 border-t border-outline-variant/25 pt-3">
          <GatheringDateLine label={openedOnLabel} />
          <GatheringMetaChips items={metaItems} />
        </div>
      </div>
    </Link>
  );
}
