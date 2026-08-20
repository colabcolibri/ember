import { getDevPorts } from './dev-ports.js';

export function resolveAppUrl(): string {
  const fromEnv = process.env.EMBER_APP_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  const { web } = getDevPorts();
  return `http://localhost:${web}`;
}

export function resolveApiPort(): number {
  const fromEnv = process.env.EMBER_API_PORT?.trim();
  if (fromEnv) {
    return Number(fromEnv);
  }
  return getDevPorts().api;
}

export function resolveApiOrigin(): string {
  const fromEnv = process.env.EMBER_API_ORIGIN?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  return `http://127.0.0.1:${resolveApiPort()}`;
}
