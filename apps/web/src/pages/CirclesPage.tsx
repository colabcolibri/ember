import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppAlert, AppEmptyState, AppPage, CircleListRow } from '../components/app/index.js';
import { apiFetch } from '../lib/api.js';
import { formatApiError } from '../lib/api-errors.js';

type CircleSummary = {
  id: string;
  status: string;
  question: string | null;
  communityName: string;
  scheduledSlot: string | null;
  scheduledAt: string | null;
  jitsiUrl: string | null;
};

export function CirclesPage() {
  const { t } = useTranslation();
  const [circles, setCircles] = useState<CircleSummary[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ circles: CircleSummary[] }>('/circles')
      .then((res) => setCircles(res.circles))
      .catch((e) => setError(formatApiError(e, t)));
  }, [t]);

  return (
    <AppPage title={t('circles.title')} lead={t('circles.subtitle')}>
      {error ? <AppAlert variant="error">{error}</AppAlert> : null}
      {circles.length === 0 ? (
        <AppEmptyState title={t('circles.empty')} />
      ) : (
        <div className="grid gap-3">
          {circles.map((circle) => (
            <CircleListRow
              key={circle.id}
              id={circle.id}
              communityName={circle.communityName}
              question={circle.question ?? t('circles.noQuestion')}
              status={circle.status}
            />
          ))}
        </div>
      )}
    </AppPage>
  );
}
