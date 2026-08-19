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
  round: { id: string; status: string; theme: string | null; questions: string[] } | null;
  slots: string[];
};

type PresenceIntention = 'surprise' | 'frontier' | 'ease';

export function PresencePage() {
  const { t } = useTranslation();
  const [roundId, setRoundId] = useState<string | null>(null);
  const [roundTheme, setRoundTheme] = useState<string | null>(null);
  const [roundQuestions, setRoundQuestions] = useState<string[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [intention, setIntention] = useState<PresenceIntention>('surprise');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    apiFetch<RoundResponse>('/rounds/current')
      .then((data) => {
        setRoundId(data.round?.id ?? null);
        setRoundTheme(data.round?.theme ?? null);
        setRoundQuestions(data.round?.questions ?? []);
        setSlots(data.slots);
      })
      .catch((err) => setError(formatApiError(err, t)))
      .finally(() => setInitialLoading(false));
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

  if (initialLoading) {
    return (
      <AppPage title={t('presence.title')}>
        <p className="text-center text-sm text-muted-foreground">{t('common.loading')}</p>
      </AppPage>
    );
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
      {roundTheme || roundQuestions.length > 0 ? (
        <AppCard title={t('presence.roundRitual')}>
          {roundTheme ? (
            <p className="mb-3 text-sm">
              <span className="font-semibold text-primary">{t('presence.roundTheme')}:</span>{' '}
              {roundTheme}
            </p>
          ) : null}
          {roundQuestions.length > 0 ? (
            <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground">
              {roundQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          ) : null}
        </AppCard>
      ) : null}
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
