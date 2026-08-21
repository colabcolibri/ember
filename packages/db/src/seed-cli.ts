#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDatabaseReady, resolveDbPath } from './migrate.js';
import { seedDevPopulation } from './seed-dev-population.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function loadDotEnv(): void {
  const envPath = resolve(repoRoot, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();
process.chdir(repoRoot);

const dbPath = resolveDbPath();
const db = ensureDatabaseReady(dbPath);

try {
  const result = seedDevPopulation(db);
  console.info('[db:seed] demo population loaded');
  console.info(`  path: ${dbPath}`);
  console.info(`  community: ${result.communityId}`);
  console.info(`  users: ${result.users}`);
  console.info(`  templates: ${result.templates}`);
  console.info(`  rounds: ${result.rounds} (2 open, 10 past)`);
  console.info(`  declarations: ${result.declarations}`);
  console.info(`  circles (published): ${result.circles}`);
  console.info(`  auto-match drafts: ${result.matchDrafts}`);
  console.info('');
  console.info('Login hints (magic link code from Mailpit / dev flow):');
  console.info('  demo@ember.app — member');
  console.info('  facilitador@demo.ember — facilitator');
  console.info('  admin@demo.ember — org admin');
} finally {
  db.close();
}
