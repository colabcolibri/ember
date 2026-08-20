import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  AppButton,
  AppEmptyState,
  AppLoading,
  AppPage,
  GatheringListRow,
  PresenceDeclareView,
} from '../components/app/index.js';
import { apiFetch } from '../lib/api.js';
import { formatApiError } from '../lib/api-errors.js';
import { showError } from '../lib/app-toast.js';
import type { OpenRoundSummary } from '../lib/gathering.js';
import { useInitialLoad } from '../lib/useInitialLoad.js';

export function PresencePage() {
  const { t } = useTranslation();
  const [openRounds, setOpenRounds] = useState<OpenRoundSummary[]>([]);

  const { initialLoading } = useInitialLoad(async () => {
    try {
      const res = await apiFetch<{ rounds: OpenRoundSummary[] }>('/rounds/open');
      setOpenRounds(res.rounds);
    } catch (err) {
      showError(formatApiError(err, t));
    }
  }, [t]);

  if (initialLoading) {
    return (
      <AppPage title={t('presence.title')} centered>
        <AppLoading />
      </AppPage>
    );
  }

  if (openRounds.length === 0) {
    return (
      <AppPage title={t('presence.title')} lead={t('presence.noRoundLead')} centered>
        <AppEmptyState
          title={t('presence.noRound')}
          description={t('presence.noRoundHint')}
          action={
            <AppButton asChild variant="outline">
              <Link to="/circles">{t('presence.viewCircles')}</Link>
            </AppButton>
          }
        />
      </AppPage>
    );
  }

  if (openRounds.length === 1) {
    return (
      <AppPage
        eyebrow={t('presence.eyebrow')}
        title={t('presence.title')}
        lead={t('presence.subtitle')}
        centered
      >
        <PresenceDeclareView roundId={openRounds[0]!.id} />
      </AppPage>
    );
  }

  return (
    <AppPage
      eyebrow={t('presence.eyebrow')}
      title={t('presence.title')}
      lead={t('presence.multipleOpenLead')}
      centered
    >
      <div className="grid gap-3">
        {openRounds.map((round) => (
          <GatheringListRow
            key={round.id}
            gathering={{
              ...round,
              status: 'open',
              declarationCount: 0,
              slotCount: 0,
              slotPreview: [],
              circleCount: 0,
            }}
            statusLabel={
              round.responseStatus === 'attending'
                ? t('presence.confirmedBadge')
                : round.responseStatus === 'declined'
                  ? t('presence.declinedBadge')
                  : t('presence.eyebrow')
            }
            statusTone={
              round.responseStatus === 'attending'
                ? 'confirmed'
                : round.responseStatus === 'declined'
                  ? 'declined'
                  : 'open'
            }
            to={`/presence/${round.id}`}
          />
        ))}
      </div>
    </AppPage>
  );
}
