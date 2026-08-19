import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import {
  AppAlert,
  AppButton,
  AppCard,
  AppLoading,
  AppPage,
  DeclarationTable,
  GatheringOverviewCard,
} from '../components/app/index.js';
import { apiFetch } from '../lib/api.js';
import { formatApiError } from '../lib/api-errors.js';
import type { GatheringDetail } from '../lib/gathering.js';
import { gatheringTitle } from '../lib/gathering.js';
import { useInitialLoad } from '../lib/useInitialLoad.js';

type Declaration = {
  userId: string;
  memberLabel: string;
  emailMasked: string;
  slots: string[];
  intention: string;
  languages: string[];
  timezone: string | null;
};

export function FacilitatorGatheringDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [gathering, setGathering] = useState<GatheringDetail | null>(null);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!id) return;
    const detail = await apiFetch<{ round: GatheringDetail }>(`/admin/matching-rounds/${id}`);
    setGathering(detail.round);
    const res = await apiFetch<{ items: Declaration[] }>(`/admin/matching-rounds/${id}/declarations`);
    setDeclarations(res.items);
  };

  const { initialLoading } = useInitialLoad(async () => {
    try {
      await load();
    } catch (err) {
      setError(formatApiError(err, t));
    }
  }, [id, t]);

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      await load();
    } catch (err) {
      setError(formatApiError(err, t));
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <AppPage title={t('facilitator.gatheringDetailTitle')}>
        <AppLoading />
      </AppPage>
    );
  }

  if (!gathering) {
    return (
      <AppPage title={t('facilitator.gatheringDetailTitle')}>
        {error ? <AppAlert variant="error">{error}</AppAlert> : null}
        <AppButton asChild variant="outline">
          <Link to="/facilitator/gatherings">{t('facilitator.backToGatherings')}</Link>
        </AppButton>
      </AppPage>
    );
  }

  const statusLabel = t(`facilitator.gatheringStatus.${gathering.status}`, {
    defaultValue: gathering.status,
  });

  return (
    <AppPage
      title={gatheringTitle(gathering, t('facilitator.untitledGathering'))}
      lead={t('facilitator.gatheringDetailSubtitle')}
      actions={
        <AppButton variant="outline" onClick={refresh} loading={loading}>
          {t('facilitator.refresh')}
        </AppButton>
      }
    >
      {error ? <AppAlert variant="error">{error}</AppAlert> : null}

      <AppButton asChild variant="outline" className="w-fit">
        <Link to="/facilitator/gatherings">{t('facilitator.backToGatherings')}</Link>
      </AppButton>

      <GatheringOverviewCard gathering={gathering} statusLabel={statusLabel} />

      <AppCard title={t('facilitator.declarations')}>
        <DeclarationTable
          items={declarations}
          emptyMessage={t('facilitator.noDeclarations')}
          slotLabels={gathering.slotLabels}
        />
      </AppCard>
    </AppPage>
  );
}
