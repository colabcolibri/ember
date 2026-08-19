import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../lib/api.js';

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

  useEffect(() => {
    apiFetch<RoundResponse>('/rounds/current')
      .then((data) => {
        setRoundId(data.round?.id ?? null);
        setSlots(data.slots);
      })
      .catch(() => setError(t('common.apiOffline')));
  }, [t]);

  function toggleSlot(slot: string) {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot],
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!roundId) return;
    setError(null);
    try {
      await apiFetch(`/rounds/${roundId}/presence`, {
        method: 'POST',
        body: JSON.stringify({ slots: selectedSlots, intention }),
      });
      setMessage(t('presence.saved'));
    } catch {
      setError(t('common.apiOffline'));
    }
  }

  if (!roundId) {
    return (
      <section className="card">
        <h2>{t('presence.title')}</h2>
        <p>{t('presence.noRound')}</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{t('presence.title')}</h2>
      <p className="lede">{t('presence.subtitle')}</p>
      <form className="form" onSubmit={onSubmit}>
        <fieldset className="fieldset">
          <legend>{t('presence.title')}</legend>
          <div className="slot-grid">
            {slots.map((slot) => (
              <label key={slot} className="slot">
                <input
                  type="checkbox"
                  checked={selectedSlots.includes(slot)}
                  onChange={() => toggleSlot(slot)}
                />
                <span>{t(`presence.slots.${slot}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="fieldset">
          <legend>{t('presence.intention')}</legend>
          {(['surprise', 'frontier', 'ease'] as const).map((value) => (
            <label key={value} className="radio">
              <input
                type="radio"
                name="intention"
                value={value}
                checked={intention === value}
                onChange={() => setIntention(value)}
              />
              <span>{t(`presence.intentions.${value}`)}</span>
            </label>
          ))}
        </fieldset>
        <button type="submit" className="btn" disabled={selectedSlots.length === 0}>
          {t('presence.submit')}
        </button>
      </form>
      {message ? <p className="ok">{message}</p> : null}
      {error ? <p className="err">{error}</p> : null}
    </section>
  );
}
