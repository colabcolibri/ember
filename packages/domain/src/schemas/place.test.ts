import { describe, expect, it } from 'vitest';
import { formatPlaceLabel } from './place.js';

describe('formatPlaceLabel', () => {
  it('includes admin area when present', () => {
    expect(
      formatPlaceLabel({ city: 'Campinas', adminArea: 'SP', country: 'Brasil' }),
    ).toBe('Campinas, SP · Brasil');
  });

  it('omits admin area when absent', () => {
    expect(formatPlaceLabel({ city: 'Lisboa', country: 'Portugal' })).toBe('Lisboa · Portugal');
  });
});
