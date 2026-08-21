import { useTranslation } from 'react-i18next';
import type { GatheringDetail } from '@/lib/gathering.js';
import { formatGatheringDate, gatheringTitle } from '@/lib/gathering.js';
import { AppBadge } from './AppBadge.js';
import { AppButton } from './AppButton.js';
import { GatheringDateLine } from './GatheringDateLine.js';
import { GatheringMetaChips } from './GatheringMetaChips.js';
import { GatheringQuestionsList } from './GatheringQuestionsList.js';

type GatheringOverviewCardProps = {
  gathering: GatheringDetail;
  statusLabel: string;
  canEdit?: boolean;
  canClose?: boolean;
  canReopen?: boolean;
  onEdit?: () => void;
  onCloseRegistrations?: () => void;
  onReopenRegistrations?: () => void;
};

export function GatheringOverviewCard({
  gathering,
  statusLabel,
  canEdit = false,
  canClose = false,
  canReopen = false,
  onEdit,
  onCloseRegistrations,
  onReopenRegistrations,
}: GatheringOverviewCardProps) {
  const { t, i18n } = useTranslation();
  const isOpen = gathering.status === 'open';
  const isClosed = gathering.status === 'closed';
  const title = gatheringTitle(gathering, t('facilitator.untitledGathering'));
  const slotLabels = Object.values(gathering.slotLabels);

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
    <article className="relative overflow-hidden rounded-card border border-outline-variant/25 bg-paper shadow-sm">
      <div
        className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full border border-primary/10"
        aria-hidden="true"
      />
      <div className="relative z-10 space-y-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <AppBadge variant={isOpen ? 'rust' : isClosed ? 'muted' : 'muted'}>{statusLabel}</AppBadge>
          </div>
          <div className="flex flex-wrap gap-2">
            {canClose ? (
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                onClick={onCloseRegistrations}
                className="shrink-0"
              >
                {t('facilitator.closeRegistrations')}
              </AppButton>
            ) : null}
            {canReopen ? (
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                onClick={onReopenRegistrations}
                className="shrink-0"
              >
                {t('facilitator.reopenRegistrations')}
              </AppButton>
            ) : null}
            {canEdit ? (
              <AppButton type="button" variant="outline" size="sm" onClick={onEdit} className="shrink-0">
                {t('facilitator.editGathering')}
              </AppButton>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            {t('facilitator.theme')}
          </p>
          <h2 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-bold text-foreground">
            {title}
          </h2>
        </div>

        <div className="grid gap-3 border-t border-outline-variant/25 pt-4">
          <GatheringDateLine label={openedOnLabel} />
          <GatheringMetaChips items={metaItems} />
        </div>

        {gathering.questions.length > 0 ? (
          <GatheringQuestionsList
            label={t('presence.questionsLabel')}
            questions={gathering.questions}
          />
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
