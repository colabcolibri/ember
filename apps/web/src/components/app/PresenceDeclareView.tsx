import {
  AppBackLink,
  AppButton,
  AppCard,
  AppLoading,
  AvailabilityPicker,
  GatheringAboutSection,
  IntentionPicker,
  PresenceStepSection,
  ProfileOnboardingBanner,
  RegionalSlotPicker,
  type RegionalSlotOption,
} from './index.js';
import { formatApiError } from '@/lib/api-errors.js';
import { apiFetch } from '@/lib/api.js';
import { showError, showSuccess } from '@/lib/app-toast.js';
import { isMockMode, MOCK_DEMO_PRESENCE } from '@/lib/mock-mode.js';
import { useInitialLoad } from '@/lib/useInitialLoad.js';
import { profileCompleteness, type ProfileCompletenessInput } from '@ember/domain/profile/completeness';
import { FormEvent, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

type RoundResponse = {
  round: {
    id: string;
    status: string;
    theme: string | null;
    questions: string[];
    templateName: string | null;
    circleSize: number | null;
    durationMinutes: number | null;
  };
  slots: RegionalSlotOption[] | string[];
  memberTimezone?: string;
};

type DeclarationResponse = {
  declaration: {
    roundId: string;
    response: 'attending' | 'declined';
    slots: string[];
    intention: PresenceIntention | null;
  } | null;
};

type MemberResponse = 'none' | 'attending' | 'declined';

type ProfileResponse = {
  displayName: string;
  editionYear: number | null;
  timezone: string;
  languages: string[];
  originPlace: unknown;
  residencePlace: unknown;
};

type PresenceIntention = 'surprise' | 'frontier' | 'ease';

type PresenceDeclareViewProps = {
  roundId: string;
  showBackLink?: boolean;
};

function isRegionalSlots(slots: RegionalSlotOption[] | string[]): slots is RegionalSlotOption[] {
  return slots.length > 0 && typeof slots[0] === 'object' && 'ref' in slots[0];
}

function countCalendars(slots: RegionalSlotOption[]): number {
  return new Set(slots.map((slot) => slot.calendarLabel)).size;
}

async function fetchRoundData(roundId: string, timezone: string): Promise<RoundResponse> {
  const params = new URLSearchParams({ timezone });
  return apiFetch<RoundResponse>(`/rounds/${roundId}?${params.toString()}`);
}

export function PresenceDeclareView({ roundId, showBackLink = false }: PresenceDeclareViewProps) {
  const { t } = useTranslation();
  const [roundTheme, setRoundTheme] = useState<string | null>(null);
  const [roundQuestions, setRoundQuestions] = useState<string[]>([]);
  const [roundTemplateName, setRoundTemplateName] = useState<string | null>(null);
  const [roundCircleSize, setRoundCircleSize] = useState<number | null>(null);
  const [roundDurationMinutes, setRoundDurationMinutes] = useState<number | null>(null);
  const [memberTimezone, setMemberTimezone] = useState('America/Sao_Paulo');
  const [regionalSlots, setRegionalSlots] = useState<RegionalSlotOption[]>([]);
  const [legacySlots, setLegacySlots] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [intention, setIntention] = useState<PresenceIntention>('surprise');
  const [memberResponse, setMemberResponse] = useState<MemberResponse>('none');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [profileMissing, setProfileMissing] = useState<ReturnType<typeof profileCompleteness>['missing']>([]);

  const applyRoundData = useCallback((data: RoundResponse) => {
    setRoundTheme(data.round?.theme ?? null);
    setRoundQuestions(data.round?.questions ?? []);
    setRoundTemplateName(data.round?.templateName ?? null);
    setRoundCircleSize(data.round?.circleSize ?? null);
    setRoundDurationMinutes(data.round?.durationMinutes ?? null);
    if (isRegionalSlots(data.slots)) {
      setRegionalSlots(data.slots);
      setLegacySlots([]);
    } else {
      setLegacySlots(data.slots);
      setRegionalSlots([]);
    }
  }, []);

  const { initialLoading } = useInitialLoad(async () => {
    setLoadError(false);
    try {
      const profile = await apiFetch<ProfileResponse>('/me/profile');
      setProfileMissing(profileCompleteness(profile as ProfileCompletenessInput).missing);

      const data = await fetchRoundData(roundId, profile.timezone ?? 'America/Sao_Paulo');
      const timezone = data.memberTimezone ?? profile.timezone ?? 'America/Sao_Paulo';
      setMemberTimezone(timezone);
      applyRoundData(data);

      const saved = await apiFetch<DeclarationResponse>(`/rounds/${roundId}/presence`);
      if (saved.declaration) {
        setMemberResponse(saved.declaration.response);
        if (saved.declaration.response === 'attending') {
          setSelectedSlots(saved.declaration.slots);
          if (saved.declaration.intention) {
            setIntention(saved.declaration.intention);
          }
        } else {
          setSelectedSlots([]);
        }
      } else if (isMockMode) {
        const available = isRegionalSlots(data.slots)
          ? data.slots.map((slot) => slot.ref)
          : data.slots;
        const prefilled = MOCK_DEMO_PRESENCE.slots.filter((slot) => available.includes(slot));
        setSelectedSlots(prefilled.length > 0 ? prefilled : available.slice(0, 2));
        setIntention(MOCK_DEMO_PRESENCE.intention);
      }
    } catch (err) {
      setLoadError(true);
      showError(formatApiError(err, t));
    }
  }, [applyRoundData, roundId, t]);

  const calendarCount = useMemo(
    () => (regionalSlots.length ? countCalendars(regionalSlots) : 0),
    [regionalSlots],
  );
  const gatheringFormat = useMemo(() => {
    const items = [
      roundTemplateName
        ? { icon: 'local_fire_department', label: roundTemplateName }
        : null,
      roundCircleSize
        ? { icon: 'group', label: t('presence.formatPeople', { count: roundCircleSize }) }
        : null,
      roundDurationMinutes
        ? { icon: 'schedule', label: t('presence.formatDuration', { minutes: roundDurationMinutes }) }
        : null,
    ].filter(Boolean) as Array<{ icon: string; label: string }>;

    if (items.length === 0) return undefined;

    return {
      label: t('presence.formatLabel'),
      items,
    };
  }, [roundTemplateName, roundCircleSize, roundDurationMinutes, t]);

  const profileIncomplete = profileMissing.length > 0;
  const alreadyDeclared = memberResponse === 'attending';
  const declined = memberResponse === 'declined';
  const submitHint =
    declined
      ? t('presence.declinedHint')
      : profileIncomplete
        ? t('onboarding.presenceHint')
        : selectedSlots.length === 0
          ? t('presence.selectAtLeastOne')
          : t('presence.submitSummary', { count: selectedSlots.length });

  async function handleTimezoneChange(timezone: string) {
    setMemberTimezone(timezone);
    setSlotsLoading(true);
    try {
      const data = await fetchRoundData(roundId, timezone);
      applyRoundData(data);
    } catch (err) {
      showError(formatApiError(err, t));
    } finally {
      setSlotsLoading(false);
    }
  }

  function toggleSlot(slot: string) {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot],
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (selectedSlots.length === 0 || profileIncomplete) return;
    setLoading(true);
    try {
      await apiFetch(`/rounds/${roundId}/presence`, {
        method: 'POST',
        body: JSON.stringify({
          response: 'attending',
          slots: selectedSlots,
          intention,
          timezone: memberTimezone,
        }),
      });
      setMemberResponse('attending');
      showSuccess(t('presence.saved'), t('presence.savedTitle'));
    } catch (err) {
      showError(formatApiError(err, t));
    } finally {
      setLoading(false);
    }
  }

  async function onDecline() {
    if (profileIncomplete) return;
    setLoading(true);
    try {
      await apiFetch(`/rounds/${roundId}/presence`, {
        method: 'POST',
        body: JSON.stringify({ response: 'declined', timezone: memberTimezone }),
      });
      setMemberResponse('declined');
      setSelectedSlots([]);
      showSuccess(t('presence.declinedSaved'), t('presence.declinedTitle'));
    } catch (err) {
      showError(formatApiError(err, t));
    } finally {
      setLoading(false);
    }
  }

  function resumeAttending() {
    setMemberResponse('none');
  }

  if (initialLoading) {
    return <AppLoading />;
  }

  if (loadError) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        {t('presence.roundUnavailable')}{' '}
        <Link to="/presence" className="font-medium text-primary underline-offset-4 hover:underline">
          {t('presence.backToOpenList')}
        </Link>
      </p>
    );
  }

  return (
    <div className="grid w-full gap-8 pb-28 sm:pb-8">
      {showBackLink ? <AppBackLink to="/presence">{t('presence.backToOpenList')}</AppBackLink> : null}

      {profileIncomplete ? <ProfileOnboardingBanner missing={profileMissing} /> : null}

      <GatheringAboutSection
        theme={roundTheme}
        questions={roundQuestions}
        themeLabel={t('presence.roundTheme')}
        questionsLabel={t('presence.questionsLabel')}
        format={gatheringFormat}
        timezone={memberTimezone}
        onTimezoneChange={handleTimezoneChange}
        timezoneLabel={t('presence.yourTimezone')}
        timezonePlaceholder={t('profile.timezonePlaceholder')}
        timezoneSearchPlaceholder={t('profile.timezoneSearch')}
        timezoneEmpty={t('profile.timezoneEmpty')}
        timezoneBrowseHint={t('profile.timezoneBrowseHint')}
        declaredStatus={
          declined
            ? {
                title: t('presence.declinedTitle'),
                hint: t('presence.declinedHint'),
                variant: 'muted',
                icon: 'event_busy',
              }
            : alreadyDeclared
              ? {
                  title: t('presence.savedTitle'),
                  hint: t('presence.declaredHint'),
                  variant: 'success',
                }
              : undefined
        }
      />

      {declined ? (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <AppButton variant="outline" onClick={resumeAttending} disabled={loading}>
            {t('presence.changeToAttending')}
          </AppButton>
        </div>
      ) : (
      <>
      <form className="grid gap-6" onSubmit={onSubmit} id={`presence-form-${roundId}`}>
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
            disabled={selectedSlots.length === 0 || slotsLoading || profileIncomplete}
            className="min-w-[min(100%,20rem)]"
          >
            {alreadyDeclared ? t('presence.update') : t('presence.submit')}
            <span className="material-symbols-outlined text-xs leading-none">check_circle</span>
          </AppButton>
          <AppButton
            type="button"
            variant="ghost"
            size="sm"
            loading={loading}
            disabled={profileIncomplete}
            onClick={() => void onDecline()}
          >
            {t('presence.decline')}
          </AppButton>
          <p className="text-center text-sm text-muted-foreground">{submitHint}</p>
        </div>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/40 bg-background/95 px-page-x py-4 backdrop-blur-md sm:hidden">
        <div className="mx-auto flex w-full max-w-ember-xl flex-col gap-2">
          <p className="text-center text-xs text-muted-foreground">{submitHint}</p>
          <AppButton
            type="submit"
            form={`presence-form-${roundId}`}
            size="lg"
            loading={loading}
            disabled={selectedSlots.length === 0 || slotsLoading || profileIncomplete}
            className="w-full"
          >
            {alreadyDeclared ? t('presence.update') : t('presence.submit')}
            <span className="material-symbols-outlined text-xs leading-none">check_circle</span>
          </AppButton>
          <AppButton
            type="button"
            variant="ghost"
            size="sm"
            loading={loading}
            disabled={profileIncomplete}
            className="w-full"
            onClick={() => void onDecline()}
          >
            {t('presence.decline')}
          </AppButton>
        </div>
      </div>
      </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {t('presence.otherEventsHint')}{' '}
        <Link to="/circles" className="font-medium text-primary underline-offset-4 hover:underline">
          {t('presence.viewCircles')}
        </Link>
      </p>
    </div>
  );
}
