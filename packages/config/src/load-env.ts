import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';
import { repoRoot } from './dev-ports.js';

export function loadRepoEnv(): void {
  const envPath = resolve(repoRoot(), '.env');
  if (existsSync(envPath)) {
    loadEnvFile(envPath);
  }
}
