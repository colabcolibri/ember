import { describe, expect, it } from 'vitest';
import { profileInputSchema } from './profile.js';

describe('profileInputSchema', () => {
  it('accepts valid profile input', () => {
    const parsed = profileInputSchema.safeParse({
      displayName: 'Ana Silva',
      editionYear: 2020,
      timezone: 'Europe/Lisbon',
      languages: ['pt', 'en'],
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects short display name', () => {
    const parsed = profileInputSchema.safeParse({
      displayName: 'A',
      editionYear: 2020,
      timezone: 'UTC',
      languages: ['pt'],
    });
    expect(parsed.success).toBe(false);
  });
});
