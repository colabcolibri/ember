import type { GatheringSummary } from '@/lib/gathering.js';
import { formatGatheringDate, gatheringTitle } from '@/lib/gathering.js';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AppBadge } from './AppBadge.js';
import { GatheringMetaChips } from './GatheringMetaChips.js';

type GatheringListRowProps = {
  gathering: GatheringSummary;
  statusLabel: string;
  className?: string;
};

export function GatheringListRow({ gathering, statusLabel, className }: GatheringListRowProps) {
  const { t, i18n } = useTranslation();
  const isOpen = gathering.status === 'open';
  const title = gatheringTitle(gathering, t('facilitator.untitledGathering'));

  const metaItems = [
    {
      icon: 'calendar_today',
      label: formatGatheringDate(gathering.createdAt, i18n.language),
    },
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
    gathering.slotCount > 0
      ? {
          icon: 'schedule',
          label:
            gathering.slotPreview.length > 0
              ? gathering.slotPreview.join(' · ')
              : t('facilitator.gatheringSlotsMeta', { count: gathering.slotCount }),
        }
      : null,
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
  ].filter(Boolean) as Array<{ icon: string; label: string }>;

  return (
    <Link
      to={`/facilitator/gatherings/${gathering.id}`}
      className={cn(
        'group relative block overflow-hidden rounded-(--radius-card)er bg-paper p-5 shadow-sm transition-colors sm:p-6',
        isOpen ? 'border-primary/30 hover:border-primary/50' : 'border-outline-variant/30 hover:border-primary/30',
        className,
      )}
    >
      <div className="ember-card-gradient pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 grid gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <AppBadge variant={isOpen ? 'rust' : 'muted'}>{statusLabel}</AppBadge>
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

        <GatheringMetaChips items={metaItems} />
      </div>
    </Link>
  );
}
