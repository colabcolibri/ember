import { afterEach, describe, expect, it } from 'vitest';
import { resolveApiOrigin, resolveApiPort, resolveAppUrl } from './urls.js';

describe('urls', () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it('uses dev-ports when env is unset', () => {
    delete process.env.EMBER_APP_URL;
    delete process.env.EMBER_API_PORT;
    delete process.env.EMBER_API_ORIGIN;
    expect(resolveAppUrl()).toBe('http://localhost:2000');
    expect(resolveApiPort()).toBe(2001);
    expect(resolveApiOrigin()).toBe('http://127.0.0.1:2001');
  });

  it('prefers env over dev-ports', () => {
    process.env.EMBER_APP_URL = 'https://app.example.com/';
    process.env.EMBER_API_PORT = '9001';
    process.env.EMBER_API_ORIGIN = 'http://api:9001/';
    expect(resolveAppUrl()).toBe('https://app.example.com');
    expect(resolveApiPort()).toBe(9001);
    expect(resolveApiOrigin()).toBe('http://api:9001');
  });
});
