import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import {
  AppAlertDialog,
  AppBackLink,
  AppButton,
  AppCard,
  AppLoading,
  AppPage,
  DeclarationTable,
  FacilitatorMatchingPanel,
  GatheringCycleStepper,
  GatheringEditDialog,
  GatheringOverviewCard,
  RoundMetricsPanel,
  type DeclarationRow,
  type RoundMetricsResponse,
} from '../components/app/index.js';
import { apiFetch } from '../lib/api.js';
import { formatApiError } from '../lib/api-errors.js';
import { showError, showSuccess } from '../lib/app-toast.js';
import {
  canCloseRegistrations,
  canReopenRegistrations,
  canRunMatching,
  type GatheringMatchProgress,
} from '../lib/gathering-cycle.js';
import type { GatheringDetail } from '../lib/gathering.js';
import { gatheringTitle } from '../lib/gathering.js';
import { useInitialLoad } from '../lib/useInitialLoad.js';

export function FacilitatorGatheringDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [gathering, setGathering] = useState<GatheringDetail | null>(null);
  const [declarations, setDeclarations] = useState<DeclarationRow[]>([]);
  const [metrics, setMetrics] = useState<RoundMetricsResponse | null>(null);
  const [matchProgress, setMatchProgress] = useState<GatheringMatchProgress>({
    hasDraft: false,
    groupCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    const detail = await apiFetch<{ round: GatheringDetail }>(`/admin/matching-rounds/${id}`);
    setGathering(detail.round);
    const res = await apiFetch<{ items: DeclarationRow[] }>(`/admin/matching-rounds/${id}/declarations`);
    setDeclarations(res.items);
    if (detail.round.circleCount > 0 || detail.round.status === 'published') {
      const metricsRes = await apiFetch<RoundMetricsResponse>(`/admin/matching-rounds/${id}/metrics`);
      setMetrics(metricsRes);
    } else {
      setMetrics(null);
    }
  };

  const { initialLoading } = useInitialLoad(async () => {
    try {
      await load();
    } catch (err) {
      showError(formatApiError(err, t));
    }
  }, [id, t]);

  async function refresh() {
    setLoading(true);
    try {
      await load();
    } catch (err) {
      showError(formatApiError(err, t));
    } finally {
      setLoading(false);
    }
  }

  async function loadDeclarations() {
    if (!id) return declarations;
    const res = await apiFetch<{ items: DeclarationRow[] }>(`/admin/matching-rounds/${id}/declarations`);
    setDeclarations(res.items);
    return res.items;
  }

  async function saveGathering(input: {
    theme: string;
    questions: string[];
    slots: Array<{ timezone: string; localDate: string; localTime: string }>;
  }) {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ round: GatheringDetail }>(`/admin/matching-rounds/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      setGathering(res.round);
      setEditOpen(false);
      showSuccess(t('facilitator.gatheringSaved'));
    } catch (err) {
      showError(formatApiError(err, t));
    } finally {
      setLoading(false);
    }
  }

  async function closeRegistrations() {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ round: GatheringDetail }>(`/admin/matching-rounds/${id}/close`, {
        method: 'POST',
        body: '{}',
      });
      setGathering(res.round);
      setCloseOpen(false);
      showSuccess(t('facilitator.registrationsClosed'));
    } catch (err) {
      showError(formatApiError(err, t));
    } finally {
      setLoading(false);
    }
  }

  async function reopenRegistrations() {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ round: GatheringDetail }>(`/admin/matching-rounds/${id}/reopen`, {
        method: 'POST',
        body: '{}',
      });
      setGathering(res.round);
      setMatchProgress({ hasDraft: false, groupCount: 0 });
      setReopenOpen(false);
      showSuccess(t('facilitator.registrationsReopened'));
    } catch (err) {
      showError(formatApiError(err, t));
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
        <AppBackLink to="/facilitator/gatherings">{t('facilitator.backToGatherings')}</AppBackLink>
      </AppPage>
    );
  }

  const statusLabel = t(`facilitator.gatheringStatus.${gathering.status}`, {
    defaultValue: gathering.status,
  });
  const showMatching = canRunMatching(gathering.status) && gathering.circleCount === 0;

  return (
    <AppPage
      eyebrow={statusLabel}
      title={gatheringTitle(gathering, t('facilitator.untitledGathering'))}
      lead={t('facilitator.gatheringDetailSubtitle')}
      actions={
        <AppButton variant="outline" onClick={refresh} loading={loading} className="shrink-0">
          {t('facilitator.refresh')}
        </AppButton>
      }
    >
      <div className="grid min-w-0 gap-6">
      <AppBackLink to="/facilitator/gatherings">{t('facilitator.backToGatherings')}</AppBackLink>

      <GatheringOverviewCard
        gathering={gathering}
        statusLabel={statusLabel}
        canEdit={gathering.status === 'open'}
        canClose={canCloseRegistrations(gathering.status)}
        canReopen={canReopenRegistrations(gathering.status, gathering.circleCount)}
        onEdit={() => setEditOpen(true)}
        onCloseRegistrations={() => setCloseOpen(true)}
        onReopenRegistrations={() => setReopenOpen(true)}
      />

      <GatheringCycleStepper status={gathering.status} match={matchProgress} />

      <GatheringEditDialog
        gathering={gathering}
        open={editOpen}
        onOpenChange={setEditOpen}
        loading={loading}
        onSave={saveGathering}
      />

      <AppAlertDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title={t('facilitator.closeRegistrations')}
        description={t('facilitator.closeRegistrationsConfirm')}
        body={t('facilitator.closeRegistrationsBody', { count: gathering.declarationCount })}
        variant="destructive"
        cancelLabel={t('facilitator.cancel')}
        confirmLabel={t('facilitator.closeRegistrationsConfirmAction')}
        onConfirm={closeRegistrations}
        loading={loading}
      />

      <AppAlertDialog
        open={reopenOpen}
        onOpenChange={setReopenOpen}
        title={t('facilitator.reopenRegistrations')}
        description={t('facilitator.reopenRegistrationsConfirm')}
        body={t('facilitator.reopenRegistrationsBody')}
        cancelLabel={t('facilitator.cancel')}
        confirmLabel={t('facilitator.reopenRegistrationsConfirmAction')}
        onConfirm={reopenRegistrations}
        loading={loading}
      />

      {showMatching ? (
        <FacilitatorMatchingPanel
          roundId={gathering.id}
          roundStatus={gathering.status}
          slotLabels={gathering.slotLabels}
          declarations={declarations}
          onReloadDeclarations={loadDeclarations}
          onPublished={load}
          onMatchStateChange={setMatchProgress}
        />
      ) : gathering.status === 'open' ? (
        <AppCard title={t('facilitator.cycle.nextStepTitle')}>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('facilitator.cycle.waitCloseHint')}
          </p>
        </AppCard>
      ) : null}

      {metrics ? <RoundMetricsPanel data={metrics} /> : null}

      <AppCard title={t('facilitator.declarations')} className="min-w-0">
        <DeclarationTable
          items={declarations}
          emptyMessage={t('facilitator.noDeclarations')}
          slotLabels={gathering.slotLabels}
        />
      </AppCard>
      </div>
    </AppPage>
  );
}
