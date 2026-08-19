import { describe, expect, it } from 'vitest';
import { filterTimezones, findTimezone, getAllTimezones } from './timezones.js';

describe('timezones', () => {
  it('loads a comprehensive IANA list', () => {
    expect(getAllTimezones().length).toBeGreaterThan(100);
  });

  it('finds Lisbon by city name', () => {
    const results = filterTimezones('lisbon');
    expect(results.some((tz) => tz.value === 'Europe/Lisbon')).toBe(true);
  });

  it('finds São Paulo by partial match', () => {
    const results = filterTimezones('sao paulo');
    expect(results.some((tz) => tz.value === 'America/Sao_Paulo')).toBe(true);
  });

  it('formats UTC offset on labels', () => {
    const lisbon = findTimezone('Europe/Lisbon');
    expect(lisbon?.utcOffset).toMatch(/^UTC[+-−]/);
    expect(lisbon?.label).toContain(lisbon?.utcOffset ?? '');
  });
});
