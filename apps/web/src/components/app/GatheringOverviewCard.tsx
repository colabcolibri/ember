import { useTranslation } from 'react-i18next';
import type { GatheringDetail } from '@/lib/gathering.js';
import { formatGatheringDate, gatheringTitle } from '@/lib/gathering.js';
import { AppBadge } from './AppBadge.js';
import { AppButton } from './AppButton.js';
import { GatheringMetaChips } from './GatheringMetaChips.js';

type GatheringOverviewCardProps = {
  gathering: GatheringDetail;
  statusLabel: string;
};

export function GatheringOverviewCard({ gathering, statusLabel }: GatheringOverviewCardProps) {
  const { t, i18n } = useTranslation();
  const isOpen = gathering.status === 'open';
  const title = gatheringTitle(gathering, t('facilitator.untitledGathering'));
  const slotLabels = Object.values(gathering.slotLabels);

  const metaItems = [
    {
      icon: 'calendar_today',
      label: t('facilitator.gatheringOpenedOn', {
        date: formatGatheringDate(gathering.createdAt, i18n.language),
      }),
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
    <article className="relative overflow-hidden rounded-[28px] border border-outline-variant/25 bg-paper shadow-sm">
      <div
        className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full border border-primary/10"
        aria-hidden="true"
      />
      <div className="relative z-10 space-y-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <AppBadge variant={isOpen ? 'rust' : 'muted'}>{statusLabel}</AppBadge>
          </div>
          <AppButton type="button" variant="outline" size="sm" disabled className="shrink-0">
            {t('facilitator.editGathering')}
          </AppButton>
        </div>

        <p className="text-xs text-muted-foreground">{t('facilitator.editGatheringSoon')}</p>

        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            {t('facilitator.theme')}
          </p>
          <h2 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-bold text-foreground">
            {title}
          </h2>
        </div>

        <GatheringMetaChips items={metaItems} />

        {gathering.questions.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {t('presence.questionsLabel')}
            </p>
            <ol className="list-decimal space-y-2 border-l-2 border-primary/20 pl-5 text-sm leading-relaxed text-foreground">
              {gathering.questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          </div>
        ) : null}

        {slotLabels.length > 0 ? (
          <div className="space-y-2 border-t border-outline-variant/30 pt-4">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {t('facilitator.gatheringSlotsTitle')}
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {slotLabels.map((label) => (
                <li
                  key={label}
                  className="rounded-xl border border-outline-variant/40 bg-background/50 px-3 py-2 text-sm text-foreground"
                >
                  {label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
}
