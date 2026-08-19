export type SlotCalendarEntry = {
  weekday: number;
  hour: number;
  minute: number;
};

export type SlotCalendar = {
  id: string;
  label: string;
  anchorTimezone: string;
};

const WEEKDAY_LABELS: Record<'pt' | 'en', string[]> = {
  pt: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

function getZonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour === '24' ? '0' : map.hour),
    minute: Number(map.minute),
    weekday: weekdayMap[map.weekday ?? 'Sun'] ?? 0,
  };
}

function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const parts = getZonedParts(guess, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
  const target = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = asUtc - guess.getTime();
  return new Date(target - offset);
}

export function resolveNextSlotDateTimeFromEntry(
  entry: SlotCalendarEntry,
  anchorTimezone: string,
  from: Date = new Date(),
): Date {
  for (let offset = 0; offset < 21; offset += 1) {
    const probe = new Date(from.getTime() + offset * 24 * 60 * 60 * 1000);
    const parts = getZonedParts(probe, anchorTimezone);
    if (parts.weekday !== entry.weekday) continue;
    const candidate = zonedTimeToUtc(
      parts.year,
      parts.month,
      parts.day,
      entry.hour,
      entry.minute,
      anchorTimezone,
    );
    if (candidate.getTime() > from.getTime()) return candidate;
  }
  throw new Error('Could not resolve next slot datetime');
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function formatSlotOfficial(
  entry: SlotCalendarEntry,
  calendar: SlotCalendar,
  locale: 'pt' | 'en' = 'pt',
): string {
  const day = WEEKDAY_LABELS[locale][entry.weekday] ?? '';
  const time = `${pad(entry.hour)}:${pad(entry.minute)}`;
  return `${day} ${time} (${calendar.label} · ${calendar.anchorTimezone})`;
}

export function formatSlotForMember(
  entry: SlotCalendarEntry,
  calendar: SlotCalendar,
  memberTimezone: string,
  locale: 'pt' | 'en' = 'pt',
): string {
  const when = resolveNextSlotDateTimeFromEntry(entry, calendar.anchorTimezone);
  const day = when.toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US', {
    timeZone: memberTimezone,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
  const time = when.toLocaleTimeString(locale === 'pt' ? 'pt-BR' : 'en-US', {
    timeZone: memberTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${day} ${time} (${memberTimezone})`;
}
