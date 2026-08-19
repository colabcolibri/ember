import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  AppAlert,
  AppButton,
  AppEmptyState,
  AppLoading,
  AppPage,
  GatheringListRow,
} from '../components/app/index.js';
import { apiFetch } from '../lib/api.js';
import { formatApiError } from '../lib/api-errors.js';
import type { GatheringSummary } from '../lib/gathering.js';
import { useInitialLoad } from '../lib/useInitialLoad.js';

export function FacilitatorGatheringsPage() {
  const { t } = useTranslation();
  const [gatherings, setGatherings] = useState<GatheringSummary[]>([]);
  const [error, setError] = useState('');

  const { initialLoading } = useInitialLoad(async () => {
    try {
      const res = await apiFetch<{ rounds: GatheringSummary[] }>('/admin/matching-rounds');
      setGatherings(res.rounds);
    } catch (err) {
      setError(formatApiError(err, t));
    }
  }, [t]);

  const openGatherings = gatherings.filter((item) => item.status === 'open');
  const closedGatherings = gatherings.filter((item) => item.status !== 'open');

  function statusLabel(status: string) {
    return t(`facilitator.gatheringStatus.${status}`, { defaultValue: status });
  }

  function renderList(items: GatheringSummary[]) {
    return (
      <div className="grid gap-3">
        {items.map((item) => (
          <GatheringListRow key={item.id} gathering={item} statusLabel={statusLabel(item.status)} />
        ))}
      </div>
    );
  }

  if (initialLoading) {
    return (
      <AppPage title={t('facilitator.gatheringsTitle')} lead={t('facilitator.gatheringsSubtitle')}>
        <AppLoading />
      </AppPage>
    );
  }

  return (
    <AppPage title={t('facilitator.gatheringsTitle')} lead={t('facilitator.gatheringsSubtitle')}>
      {error ? <AppAlert variant="error">{error}</AppAlert> : null}

      {gatherings.length === 0 ? (
        <AppEmptyState
          title={t('facilitator.noGatherings')}
          description={t('facilitator.noGatheringsHint')}
          action={
            <AppButton asChild>
              <Link to="/facilitator">{t('facilitator.goToPanel')}</Link>
            </AppButton>
          }
        />
      ) : (
        <div className="grid gap-8">
          {openGatherings.length > 0 ? (
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                {t('facilitator.gatheringsOpenSection')}
              </h2>
              {renderList(openGatherings)}
            </section>
          ) : null}

          {closedGatherings.length > 0 ? (
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                {t('facilitator.gatheringsClosedSection')}
              </h2>
              {renderList(closedGatherings)}
            </section>
          ) : null}
        </div>
      )}
    </AppPage>
  );
}
