import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClockIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { AppButton, AppFormField, AppInput, TimezoneCombobox } from './index.js';

export type DraftRoundSlot = {
  ref: string;
  timezone: string;
  localDate: string;
  localTime: string;
  officialLabel: string;
};

type RoundSlotBuilderProps = {
  slots: DraftRoundSlot[];
  onAdd: (slot: Omit<DraftRoundSlot, 'ref' | 'officialLabel'> & { officialLabel: string }) => void;
  onRemove: (ref: string) => void;
};

function formatPreview(timezone: string, localDate: string, localTime: string, locale: string) {
  try {
    const [year, month, day] = localDate.split('-').map(Number);
    const [hour, minute] = localTime.split(':').map(Number);
    const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    return guess.toLocaleString(locale, {
      timeZone: timezone,
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return `${localDate} ${localTime}`;
  }
}

export function RoundSlotBuilder({ slots, onAdd, onRemove }: RoundSlotBuilderProps) {
  const { t, i18n } = useTranslation();
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [localDate, setLocalDate] = useState('');
  const [localTime, setLocalTime] = useState('');

  const locale = i18n.language === 'en' ? 'en-US' : 'pt-BR';
  const canAdd = Boolean(localDate && localTime);
  const previewLabel = useMemo(() => {
    if (!canAdd) return null;
    return `${formatPreview(timezone, localDate, localTime, locale)} (${timezone})`;
  }, [canAdd, timezone, localDate, localTime, locale]);

  function handleAdd() {
    if (!localDate || !localTime || !previewLabel) return;
    onAdd({ timezone, localDate, localTime, officialLabel: previewLabel });
    setLocalTime('');
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">{t('facilitator.slotHelper')}</p>

      <div className="rounded-2xl border border-outline-variant/60 bg-muted/20 p-4 sm:p-5">
        <div className="grid gap-4">
          <AppFormField
            label={t('facilitator.slotTimezone')}
            htmlFor="slot-timezone"
            className="min-w-0"
          >
            <TimezoneCombobox
              id="slot-timezone"
              value={timezone}
              onChange={setTimezone}
              placeholder={t('profile.timezonePlaceholder')}
              searchPlaceholder={t('profile.timezoneSearch')}
              emptyMessage={t('profile.timezoneEmpty')}
              browseHint={t('profile.timezoneBrowseHint')}
            />
          </AppFormField>

          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] min-[480px]:items-end">
            <AppFormField
              label={t('facilitator.slotDate')}
              htmlFor="slot-date"
              className="min-w-0"
            >
              <AppInput
                id="slot-date"
                type="date"
                className="min-w-0"
                value={localDate}
                onChange={(e) => setLocalDate(e.target.value)}
              />
            </AppFormField>

            <AppFormField
              label={t('facilitator.slotTime')}
              htmlFor="slot-time"
              className="min-w-0"
            >
              <AppInput
                id="slot-time"
                type="time"
                className="min-w-0"
                value={localTime}
                onChange={(e) => setLocalTime(e.target.value)}
              />
            </AppFormField>

            <AppButton
              type="button"
              variant="outline"
              className="w-full min-[480px]:w-auto min-[480px]:shrink-0"
              disabled={!canAdd}
              onClick={handleAdd}
            >
              <PlusIcon className="size-4" aria-hidden="true" />
              {t('facilitator.addSlot')}
            </AppButton>
          </div>

          {previewLabel ? (
            <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-foreground">
              <ClockIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <p>
                <span className="font-medium">{t('facilitator.slotPreview')}</span>{' '}
                <span className="text-muted-foreground">{previewLabel}</span>
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {slots.length > 0 ? (
        <ul className="grid gap-2">
          {slots.map((slot) => (
            <li
              key={slot.ref}
              className="flex flex-col gap-3 rounded-xl border border-outline-variant/60 bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{slot.officialLabel}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{slot.timezone}</p>
              </div>
              <AppButton
                type="button"
                variant="ghost"
                size="sm"
                className="w-full shrink-0 sm:w-auto"
                onClick={() => onRemove(slot.ref)}
              >
                <Trash2Icon className="size-4" aria-hidden="true" />
                {t('facilitator.removeSlot')}
              </AppButton>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-outline-variant/60 px-4 py-3 text-sm text-muted-foreground">
          {t('facilitator.noSlotsYet')}
        </p>
      )}
    </div>
  );
}
