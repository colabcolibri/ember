import { AppFormField } from './AppFormField.js';
import { GatheringMetaChips } from './GatheringMetaChips.js';
import { GatheringQuestionsList } from './GatheringQuestionsList.js';
import { TimezoneCombobox } from './TimezoneCombobox.js';

type DeclaredStatus = {
  title: string;
  hint: string;
  variant?: 'success' | 'muted';
  icon?: 'check_circle' | 'event_busy';
};

type GatheringFormat = {
  label: string;
  items: Array<{ icon: string; label: string }>;
};

type GatheringAboutSectionProps = {
  theme: string | null;
  questions: string[];
  themeLabel: string;
  questionsLabel: string;
  format?: GatheringFormat;
  declaredStatus?: DeclaredStatus;
  timezone: string;
  onTimezoneChange: (timezone: string) => void;
  timezoneLabel: string;
  timezonePlaceholder: string;
  timezoneSearchPlaceholder: string;
  timezoneEmpty: string;
  timezoneBrowseHint: string;
};

export function GatheringAboutSection({
  theme,
  questions,
  themeLabel,
  questionsLabel,
  format,
  declaredStatus,
  timezone,
  onTimezoneChange,
  timezoneLabel,
  timezonePlaceholder,
  timezoneSearchPlaceholder,
  timezoneEmpty,
  timezoneBrowseHint,
}: GatheringAboutSectionProps) {
  if (!theme && questions.length === 0 && !format?.items.length) return null;

  const headline = theme?.trim() || questions[0];
  const listedQuestions = theme ? questions : questions.slice(1);

  return (
    <article className="relative overflow-hidden rounded-card border border-outline-variant/25 bg-paper shadow-sm">
      <div
        className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full border border-primary/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 size-44 rounded-full border border-primary/5"
        aria-hidden="true"
      />
      <div className="relative z-10 space-y-5 p-6 sm:p-8">
        {declaredStatus ? (
          <div
            className={
              declaredStatus.variant === 'muted'
                ? 'rounded-xl border border-outline-variant/40 bg-muted/30 px-4 py-3.5'
                : 'rounded-xl border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/8 px-4 py-3.5'
            }
          >
            <div className="flex gap-3">
              <span
                className={
                  declaredStatus.variant === 'muted'
                    ? 'material-symbols-outlined shrink-0 text-muted-foreground'
                    : 'material-symbols-outlined shrink-0 text-success'
                }
              >
                {declaredStatus.icon ?? (declaredStatus.variant === 'muted' ? 'event_busy' : 'check_circle')}
              </span>
              <div className="min-w-0 space-y-1">
                <p className="font-semibold text-foreground">{declaredStatus.title}</p>
                <p className="text-sm text-muted-foreground">{declaredStatus.hint}</p>
              </div>
            </div>
          </div>
        ) : null}

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

        {format && format.items.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {format.label}
            </p>
            <GatheringMetaChips items={format.items} />
          </div>
        ) : null}

        {listedQuestions.length > 0 ? (
          <GatheringQuestionsList label={questionsLabel} questions={listedQuestions} />
        ) : null}

        <div className="grid gap-4 border-t border-outline-variant/30 pt-4">
          <AppFormField label={timezoneLabel} htmlFor="presence-timezone">
            <TimezoneCombobox
              id="presence-timezone"
              value={timezone}
              onChange={onTimezoneChange}
              placeholder={timezonePlaceholder}
              searchPlaceholder={timezoneSearchPlaceholder}
              emptyMessage={timezoneEmpty}
              browseHint={timezoneBrowseHint}
            />
          </AppFormField>
        </div>
      </div>
    </article>
  );
}
