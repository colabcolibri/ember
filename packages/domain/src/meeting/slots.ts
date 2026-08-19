const SLOT_SPECS: Record<string, { weekday: number; hour: number; minute: number }> = {
  'mon-19h': { weekday: 1, hour: 19, minute: 0 },
  'tue-19h': { weekday: 2, hour: 19, minute: 0 },
  'wed-19h': { weekday: 3, hour: 19, minute: 0 },
  'thu-19h': { weekday: 4, hour: 19, minute: 0 },
  'sat-10h': { weekday: 6, hour: 10, minute: 0 },
};

/** America/Sao_Paulo — sem DST desde 2019 (UTC-3 fixo no piloto). */
const SP_OFFSET_MS = -3 * 60 * 60 * 1000;

function spParts(date: Date): { year: number; month: number; day: number; weekday: number } {
  const shifted = new Date(date.getTime() + SP_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

function spToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0) - SP_OFFSET_MS);
}

export function resolveNextSlotDateTime(slot: string, from: Date = new Date()): Date {
  const spec = SLOT_SPECS[slot];
  if (!spec) {
    throw new Error(`Unknown facilitator slot: ${slot}`);
  }
  for (let offset = 0; offset < 14; offset += 1) {
    const probe = new Date(from.getTime() + offset * 24 * 60 * 60 * 1000);
    const parts = spParts(probe);
    if (parts.weekday !== spec.weekday) continue;
    const candidate = spToUtc(parts.year, parts.month, parts.day, spec.hour, spec.minute);
    if (candidate.getTime() > from.getTime()) {
      return candidate;
    }
  }
  throw new Error(`Could not resolve next datetime for slot ${slot}`);
}

export function formatSlotLocal(slot: string, when: Date, locale: 'pt' | 'en' = 'pt'): string {
  const spec = SLOT_SPECS[slot];
  if (!spec) return slot;
  const labels =
    locale === 'pt'
      ? ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = labels[spec.weekday] ?? slot;
  const hour = String(spec.hour).padStart(2, '0');
  const minute = String(spec.minute).padStart(2, '0');
  const date = when.toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'short',
  });
  return `${day} ${date} ${hour}:${minute} (America/Sao_Paulo)`;
}
