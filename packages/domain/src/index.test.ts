import { describe, expect, it } from 'vitest';
import { EMBER_DOMAIN_VERSION } from './index.js';

describe('domain package', () => {
  it('exports version marker', () => {
    expect(EMBER_DOMAIN_VERSION).toBe('0.1.0');
  });
});
