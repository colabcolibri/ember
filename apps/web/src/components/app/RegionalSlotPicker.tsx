import { useTranslation } from 'react-i18next';
import { AppBadge } from './AppBadge.js';
import { formatTimezoneShort, parseSlotLabel } from '@/lib/slot-label';
import { cn } from '@/lib/utils';

export type RegionalSlotOption = {
  ref: string;
  calendarLabel: string;
  officialLabel: string;
  localLabel: string;
};

type RegionalSlotPickerProps = {
  slots: RegionalSlotOption[];
  selected: string[];
  onToggle: (ref: string) => void;
  memberTimezone: string;
  multiCalendarHint?: string;
  selectedCountLabel?: (selected: number, total: number) => string;
};

function resolveGroupTitle(
  calendarLabel: string,
  memberTimezone: string,
  locale: string,
  multipleCalendars: boolean,
): string {
  if (multipleCalendars && !calendarLabel.includes('/')) {
    return calendarLabel;
  }
  return formatTimezoneShort(memberTimezone, locale);
}

export function RegionalSlotPicker({
  slots,
  selected,
  onToggle,
  memberTimezone,
  multiCalendarHint,
  selectedCountLabel,
}: RegionalSlotPickerProps) {
  const { i18n } = useTranslation();
  const grouped = slots.reduce<Record<string, RegionalSlotOption[]>>((acc, slot) => {
    acc[slot.calendarLabel] ??= [];
    acc[slot.calendarLabel]!.push(slot);
    return acc;
  }, {});

  const calendarEntries = Object.entries(grouped);
  const multipleCalendars = calendarEntries.length > 1;

  return (
    <div className="grid gap-5">
      {multipleCalendars && multiCalendarHint ? (
        <p className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-foreground">
          {multiCalendarHint}
        </p>
      ) : null}

      {calendarEntries.map(([calendarLabel, calendarSlots]) => {
        const selectedInCalendar = calendarSlots.filter((slot) => selected.includes(slot.ref)).length;

        return (
          <div
            key={calendarLabel}
            className={cn(
              'grid gap-3 rounded-2xl border border-outline-variant/40 bg-background/40 p-4 sm:p-5',
              multipleCalendars && 'shadow-sm',
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                {resolveGroupTitle(calendarLabel, memberTimezone, i18n.language, multipleCalendars)}
              </p>
              {selectedCountLabel ? (
                <AppBadge variant={selectedInCalendar > 0 ? 'rust' : 'muted'}>
                  {selectedCountLabel(selectedInCalendar, calendarSlots.length)}
                </AppBadge>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {calendarSlots.map((slot) => {
                const active = selected.includes(slot.ref);
                const local = parseSlotLabel(slot.localLabel);

                return (
                  <button
                    key={slot.ref}
                    type="button"
                    onClick={() => onToggle(slot.ref)}
                    aria-pressed={active}
                    className={cn(
                      'group relative rounded-xl border px-4 py-3.5 text-left transition-all',
                      active
                        ? 'border-2 border-primary bg-primary/10 shadow-sm'
                        : 'border border-outline-variant bg-background hover:border-primary/30 hover:bg-background/80',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-3 right-3 flex size-5 items-center justify-center rounded-full border transition-colors',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-outline-variant bg-background text-transparent group-hover:border-primary/40',
                      )}
                      aria-hidden="true"
                    >
                      <span className="material-symbols-outlined text-[11px] leading-none">check</span>
                    </span>

                    <span className="block pr-8 text-base font-semibold leading-snug text-foreground">
                      {local.when}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
