import { FormEvent, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  AppAlert,
  AppButton,
  AppCard,
  AppEmptyState,
  AppLoading,
  AppPage,
  AvailabilityPicker,
  IntentionPicker,
  PresenceRoundHero,
  PresenceStepSection,
  RegionalSlotPicker,
  type RegionalSlotOption,
} from '../components/app/index.js';
import { apiFetch } from '../lib/api.js';
import { formatApiError } from '../lib/api-errors.js';
import { useInitialLoad } from '../lib/useInitialLoad.js';

type RoundResponse = {
  round: { id: string; status: string; theme: string | null; questions: string[] } | null;
  slots: RegionalSlotOption[] | string[];
  memberTimezone?: string;
};

type DeclarationResponse = {
  declaration: {
    roundId: string;
    slots: string[];
    intention: PresenceIntention;
  } | null;
};

type PresenceIntention = 'surprise' | 'frontier' | 'ease';

function isRegionalSlots(slots: RegionalSlotOption[] | string[]): slots is RegionalSlotOption[] {
  return slots.length > 0 && typeof slots[0] === 'object' && 'ref' in slots[0];
}

function countCalendars(slots: RegionalSlotOption[]): number {
  return new Set(slots.map((slot) => slot.calendarLabel)).size;
}

async function fetchRoundData(timezone: string): Promise<RoundResponse> {
  const params = new URLSearchParams({ timezone });
  return apiFetch<RoundResponse>(`/rounds/current?${params.toString()}`);
}

export function PresencePage() {
  const { t } = useTranslation();
  const [roundId, setRoundId] = useState<string | null>(null);
  const [roundTheme, setRoundTheme] = useState<string | null>(null);
  const [roundQuestions, setRoundQuestions] = useState<string[]>([]);
  const [memberTimezone, setMemberTimezone] = useState('America/Sao_Paulo');
  const [regionalSlots, setRegionalSlots] = useState<RegionalSlotOption[]>([]);
  const [legacySlots, setLegacySlots] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [intention, setIntention] = useState<PresenceIntention>('surprise');
  const [alreadyDeclared, setAlreadyDeclared] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const applyRoundData = useCallback((data: RoundResponse) => {
    setRoundId(data.round?.id ?? null);
    setRoundTheme(data.round?.theme ?? null);
    setRoundQuestions(data.round?.questions ?? []);
    if (isRegionalSlots(data.slots)) {
      setRegionalSlots(data.slots);
      setLegacySlots([]);
    } else {
      setLegacySlots(data.slots);
      setRegionalSlots([]);
    }
  }, []);

  const { initialLoading } = useInitialLoad(async () => {
    try {
      const data = await apiFetch<RoundResponse>('/rounds/current');
      const timezone = data.memberTimezone ?? 'America/Sao_Paulo';
      setMemberTimezone(timezone);
      applyRoundData(data);

      if (data.round?.id) {
        const saved = await apiFetch<DeclarationResponse>(`/rounds/${data.round.id}/presence`);
        if (saved.declaration) {
          setSelectedSlots(saved.declaration.slots);
          setIntention(saved.declaration.intention);
          setAlreadyDeclared(true);
        }
      }
    } catch (err) {
      setError(formatApiError(err, t));
    }
  }, [applyRoundData, t]);

  const slotCount = regionalSlots.length || legacySlots.length;
  const calendarCount = useMemo(
    () => (regionalSlots.length ? countCalendars(regionalSlots) : 0),
    [regionalSlots],
  );
  const submitHint =
    selectedSlots.length === 0
      ? t('presence.selectAtLeastOne')
      : t('presence.submitSummary', { count: selectedSlots.length });

  async function handleTimezoneChange(timezone: string) {
    setMemberTimezone(timezone);
    setMessage(null);
    setSlotsLoading(true);
    try {
      const data = await fetchRoundData(timezone);
      applyRoundData(data);
    } catch (err) {
      setError(formatApiError(err, t));
    } finally {
      setSlotsLoading(false);
    }
  }

  function toggleSlot(slot: string) {
    setMessage(null);
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot],
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!roundId || selectedSlots.length === 0) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/rounds/${roundId}/presence`, {
        method: 'POST',
        body: JSON.stringify({ slots: selectedSlots, intention, timezone: memberTimezone }),
      });
      setAlreadyDeclared(true);
      setMessage(t('presence.saved'));
    } catch (err) {
      setError(formatApiError(err, t));
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <AppPage title={t('presence.title')} centered>
        <AppLoading />
      </AppPage>
    );
  }

  if (!roundId) {
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
        {error ? <AppAlert variant="error">{error}</AppAlert> : null}
      </AppPage>
    );
  }

  return (
    <AppPage
      eyebrow={t('presence.eyebrow')}
      title={t('presence.title')}
      lead={t('presence.subtitle')}
      centered
      className="pb-28 sm:pb-8"
    >
      {message ? <AppAlert variant="success" title={t('presence.savedTitle')}>{message}</AppAlert> : null}
      {error ? <AppAlert variant="error">{error}</AppAlert> : null}

      <PresenceRoundHero
        theme={roundTheme}
        questions={roundQuestions}
        timezone={memberTimezone}
        onTimezoneChange={handleTimezoneChange}
        alreadyDeclared={alreadyDeclared}
        ritualLabel={t('presence.roundRitual')}
        themeLabel={t('presence.roundTheme')}
        timezoneHint={t('presence.yourTimezone')}
        timezonePlaceholder={t('profile.timezonePlaceholder')}
        timezoneSearchPlaceholder={t('profile.timezoneSearch')}
        timezoneEmpty={t('profile.timezoneEmpty')}
        timezoneBrowseHint={t('profile.timezoneBrowseHint')}
        slotsMeta={
          calendarCount > 1
            ? t('presence.openSlotsMetaMulti', { count: slotCount, calendars: calendarCount })
            : t('presence.openSlotsMeta', { count: slotCount })
        }
        declaredLabel={t('presence.alreadyDeclared')}
        questionsLabel={t('presence.questionsLabel')}
      />

      <form className="grid gap-8" onSubmit={onSubmit} id="presence-form">
        <AppCard className="border-outline-variant/25">
          <div className="grid gap-10">
            <PresenceStepSection
              step={1}
              title={t('presence.slotsLabel')}
              hint={t('presence.slotsHint')}
            >
              {slotsLoading ? (
                <div className="py-6">
                  <AppLoading />
                </div>
              ) : regionalSlots.length > 0 ? (
                <RegionalSlotPicker
                  slots={regionalSlots}
                  selected={selectedSlots}
                  onToggle={toggleSlot}
                  memberTimezone={memberTimezone}
                  officialHint={t('presence.officialTime')}
                  localHint={t('presence.localTime')}
                  multiCalendarHint={
                    calendarCount > 1 ? t('presence.multiCalendarHint') : undefined
                  }
                  selectedCountLabel={(selected, total) =>
                    t('presence.calendarSelected', { selected, total })
                  }
                />
              ) : (
                <AvailabilityPicker
                  slots={legacySlots}
                  selected={selectedSlots}
                  onToggle={toggleSlot}
                  label={(slot) => t(`presence.slots.${slot}`)}
                />
              )}
            </PresenceStepSection>

            <PresenceStepSection
              step={2}
              title={t('presence.intention')}
              hint={t('presence.intentionHint')}
            >
              <IntentionPicker
                value={intention}
                onChange={(value) => {
                  setMessage(null);
                  setIntention(value);
                }}
                options={['surprise', 'frontier', 'ease'] as const}
                label={(value) => t(`presence.intentions.${value}`)}
                hint={(value) => t(`presence.intentionHints.${value}`)}
              />
            </PresenceStepSection>
          </div>
        </AppCard>

        <div className="hidden sm:flex sm:flex-col sm:items-center sm:gap-3">
          <AppButton
            type="submit"
            size="lg"
            loading={loading}
            disabled={selectedSlots.length === 0 || slotsLoading}
            className="min-w-[min(100%,20rem)]"
          >
            {t('presence.submit')}
            <span className="material-symbols-outlined text-sm">check_circle</span>
          </AppButton>
          <p className="text-center text-sm text-muted-foreground">{submitHint}</p>
        </div>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/40 bg-background/95 px-page-x py-4 backdrop-blur-md sm:hidden">
        <div className="mx-auto flex w-full max-w-ember-xl flex-col gap-2">
          <p className="text-center text-xs text-muted-foreground">{submitHint}</p>
          <AppButton
            type="submit"
            form="presence-form"
            size="lg"
            loading={loading}
            disabled={selectedSlots.length === 0 || slotsLoading}
            className="w-full"
          >
            {t('presence.submit')}
            <span className="material-symbols-outlined text-sm">check_circle</span>
          </AppButton>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {t('presence.otherEventsHint')}{' '}
        <Link to="/circles" className="font-medium text-primary underline-offset-4 hover:underline">
          {t('presence.viewCircles')}
        </Link>
      </p>
    </AppPage>
  );
}
