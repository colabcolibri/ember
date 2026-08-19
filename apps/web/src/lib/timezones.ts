import { getTimeZones, type TimeZone } from '@vvo/tzdb';

export type TimezoneOption = {
  value: string;
  label: string;
  utcOffset: string;
  searchText: string;
};

const ALL_TIMEZONES: TimezoneOption[] = getTimeZones({ includeUtc: true })
  .map((tz) => toTimezoneOption(tz))
  .sort((a, b) => a.searchText.localeCompare(b.searchText, undefined, { sensitivity: 'base' }));

const TIMEZONE_BY_VALUE = new Map(ALL_TIMEZONES.map((tz) => [tz.value, tz]));

const SEARCH_RESULT_LIMIT = 80;

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

function formatUtcOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '−';
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  if (minutes === 0) {
    return `UTC${sign}${hours}`;
  }
  return `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function toTimezoneOption(tz: TimeZone): TimezoneOption {
  const cities = tz.mainCities.slice(0, 2).join(', ');
  const utcOffset = formatUtcOffset(tz.currentTimeOffsetInMinutes);
  const label = cities
    ? `${tz.alternativeName} — ${cities} (${utcOffset})`
    : `${tz.alternativeName} (${utcOffset})`;

  return {
    value: tz.name,
    label,
    utcOffset,
    searchText: normalizeSearch(
      [
        tz.name,
        tz.alternativeName,
        tz.countryName,
        tz.continentName,
        ...tz.mainCities,
        ...tz.group,
        tz.abbreviation,
      ].join(' '),
    ),
  };
}

export function getAllTimezones(): TimezoneOption[] {
  return ALL_TIMEZONES;
}

export function findTimezone(value: string): TimezoneOption | undefined {
  return TIMEZONE_BY_VALUE.get(value);
}

export function timezoneDisplayLabel(value: string): string {
  const found = findTimezone(value);
  if (found) {
    return found.label;
  }
  return value;
}

export function filterTimezones(query: string): TimezoneOption[] {
  const q = normalizeSearch(query.trim());
  if (!q) {
    return ALL_TIMEZONES.slice(0, SEARCH_RESULT_LIMIT);
  }

  const matches: TimezoneOption[] = [];
  for (const tz of ALL_TIMEZONES) {
    if (tz.searchText.includes(q) || normalizeSearch(tz.value).includes(q)) {
      matches.push(tz);
      if (matches.length >= SEARCH_RESULT_LIMIT) break;
    }
  }
  return matches;
}
