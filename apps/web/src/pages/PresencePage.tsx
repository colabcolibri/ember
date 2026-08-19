import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppAlert,
  AppButton,
  AppCard,
  AppEmptyState,
  AppPage,
  AvailabilityPicker,
  IntentionPicker,
} from '../components/app/index.js';
import { apiFetch } from '../lib/api.js';
import { formatApiError } from '../lib/api-errors.js';

type RoundResponse = {
  round: { id: string; status: string } | null;
  slots: string[];
};

type PresenceIntention = 'surprise' | 'frontier' | 'ease';

export function PresencePage() {
  const { t } = useTranslation();
  const [roundId, setRoundId] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [intention, setIntention] = useState<PresenceIntention>('surprise');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<RoundResponse>('/rounds/current')
      .then((data) => {
        setRoundId(data.round?.id ?? null);
        setSlots(data.slots);
      })
      .catch((err) => setError(formatApiError(err, t)));
  }, [t]);

  function toggleSlot(slot: string) {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot],
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!roundId) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/rounds/${roundId}/presence`, {
        method: 'POST',
        body: JSON.stringify({ slots: selectedSlots, intention }),
      });
      setMessage(t('presence.saved'));
    } catch (err) {
      setError(formatApiError(err, t));
    } finally {
      setLoading(false);
    }
  }

  if (!roundId) {
    return (
      <AppPage title={t('presence.title')}>
        <AppEmptyState title={t('presence.noRound')} />
        {error ? <AppAlert variant="error">{error}</AppAlert> : null}
      </AppPage>
    );
  }

  return (
    <AppPage title={t('presence.title')} lead={t('presence.subtitle')}>
      <form className="grid gap-6" onSubmit={onSubmit}>
        <AppCard sectionLabel={t('presence.slotsLabel')}>
          <AvailabilityPicker
            slots={slots}
            selected={selectedSlots}
            onToggle={toggleSlot}
            label={(slot) => t(`presence.slots.${slot}`)}
          />
        </AppCard>
        <AppCard sectionLabel={t('presence.intention')}>
          <IntentionPicker
            value={intention}
            onChange={setIntention}
            options={['surprise', 'frontier', 'ease'] as const}
            label={(value) => t(`presence.intentions.${value}`)}
            hint={(value) => t(`presence.intentionHints.${value}`)}
          />
        </AppCard>
        <AppButton
          type="submit"
          size="lg"
          loading={loading}
          disabled={selectedSlots.length === 0}
          className="w-full sm:w-auto"
        >
          {t('presence.submit')}
          <span className="material-symbols-outlined text-sm">check</span>
        </AppButton>
      </form>
      {message ? <AppAlert variant="success">{message}</AppAlert> : null}
      {error ? <AppAlert variant="error">{error}</AppAlert> : null}
    </AppPage>
  );
}
