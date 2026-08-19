export type ParsedSlotLabel = {
  when: string;
  timezone: string;
};

export function parseSlotLabel(label: string): ParsedSlotLabel {
  const match = label.match(/^(.+?)\s+\(([^)]+)\)$/);
  if (!match) {
    return { when: label, timezone: '' };
  }
  return { when: match[1], timezone: match[2] };
}

export function slotLabelsMatch(a: string, b: string): boolean {
  const left = parseSlotLabel(a);
  const right = parseSlotLabel(b);
  return left.when === right.when && left.timezone === right.timezone;
}

export function formatTimezoneShort(timezone: string, locale: string): string {
  try {
    const parts = new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    const offset = parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
    const city = timezone.split('/').pop()?.replace(/_/g, ' ') ?? timezone;
    return offset ? `${city} · ${offset}` : city;
  } catch {
    return timezone;
  }
}
