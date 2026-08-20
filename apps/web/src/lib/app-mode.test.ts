import { describe, expect, it } from 'vitest';
import { isAppOnlyMode, loginPath } from './app-mode.js';

describe('app-mode', () => {
  it('exposes consistent login path for current build', () => {
    expect(loginPath()).toBe(isAppOnlyMode ? '/' : '/login');
  });
});
