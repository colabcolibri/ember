import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type DevPorts = {
  web: number;
  api: number;
  mailpitSmtp: number;
  mailpitWeb: number;
};

let cached: DevPorts | null = null;

export function repoRoot(): string {
  return resolve(fileURLToPath(new URL('../../..', import.meta.url)));
}

export function getDevPorts(): DevPorts {
  if (!cached) {
    const file = resolve(repoRoot(), 'config/dev-ports.json');
    cached = JSON.parse(readFileSync(file, 'utf8')) as DevPorts;
  }
  return cached;
}
