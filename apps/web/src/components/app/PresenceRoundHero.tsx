import type { ReactNode } from 'react';
import { AppBadge } from './AppBadge.js';
import { TimezoneCombobox } from './TimezoneCombobox.js';
import { cn } from '@/lib/utils';

type PresenceRoundHeroProps = {
  theme: string | null;
  questions: string[];
  timezone: string;
  onTimezoneChange: (timezone: string) => void;
  timezoneHint: string;
  timezonePlaceholder: string;
  timezoneSearchPlaceholder: string;
  timezoneEmpty: string;
  timezoneBrowseHint: string;
  alreadyDeclared: boolean;
  ritualLabel: string;
  themeLabel: string;
  slotsMeta: string;
  declaredLabel: string;
  questionsLabel: string;
};

export function PresenceRoundHero({
  theme,
  questions,
  timezone,
  onTimezoneChange,
  timezoneHint,
  timezonePlaceholder,
  timezoneSearchPlaceholder,
  timezoneEmpty,
  timezoneBrowseHint,
  alreadyDeclared,
  ritualLabel,
  themeLabel,
  slotsMeta,
  declaredLabel,
  questionsLabel,
}: PresenceRoundHeroProps) {
  const headline = theme?.trim() || questions[0] || ritualLabel;
  const listedQuestions = theme ? questions : questions.slice(1);

  return (
    <article className="relative overflow-hidden rounded-[28px] border border-outline-variant/25 bg-paper shadow-sm">
      <div
        className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full border border-primary/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 size-44 rounded-full border border-primary/5"
        aria-hidden="true"
      />
      <div className="relative z-10 space-y-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          {alreadyDeclared ? <AppBadge variant="sage">{declaredLabel}</AppBadge> : null}
          <AppBadge variant="rust">{ritualLabel}</AppBadge>
        </div>

        <div className="space-y-2">
          {theme ? (
            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {themeLabel}
            </p>
          ) : null}
          <h2 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-bold text-foreground">
            {headline}
          </h2>
        </div>

        {listedQuestions.length > 0 ? (
          <div className="space-y-3">
            {theme ? (
              <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                {questionsLabel}
              </p>
            ) : null}
            <ol className="list-decimal space-y-2 border-l-2 border-primary/20 pl-5 text-sm leading-relaxed text-foreground">
              {listedQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          </div>
        ) : null}

        <div className="grid gap-3 rounded-2xl border border-outline-variant/35 bg-background/50 p-4 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:items-center sm:gap-4">
          <label htmlFor="presence-timezone" className="text-sm font-medium text-foreground">
            {timezoneHint}
          </label>
          <TimezoneCombobox
            id="presence-timezone"
            value={timezone}
            onChange={onTimezoneChange}
            placeholder={timezonePlaceholder}
            searchPlaceholder={timezoneSearchPlaceholder}
            emptyMessage={timezoneEmpty}
            browseHint={timezoneBrowseHint}
          />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-outline-variant/30 pt-4">
          <MetaChip icon="event_available">{slotsMeta}</MetaChip>
        </div>
      </div>
    </article>
  );
}

function MetaChip({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full border border-outline-variant/50',
        'bg-background/70 px-3 py-1.5 text-xs text-muted-foreground',
      )}
    >
      <span className="material-symbols-outlined shrink-0 text-sm text-primary">{icon}</span>
      <span className="truncate">{children}</span>
    </span>
  );
}
