import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { AppPage, PresenceDeclareView } from '../components/app/index.js';

export function PresenceRoundPage() {
  const { t } = useTranslation();
  const { roundId } = useParams();

  if (!roundId) {
    return null;
  }

  return (
    <AppPage
      eyebrow={t('presence.eyebrow')}
      title={t('presence.title')}
      lead={t('presence.subtitle')}
      centered
    >
      <PresenceDeclareView roundId={roundId} showBackLink />
    </AppPage>
  );
}
