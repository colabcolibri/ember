#!/usr/bin/env node
import { ensureDatabaseReady, resolveDbPath } from './migrate.js';

const dbPath = resolveDbPath();
const db = ensureDatabaseReady(dbPath);
const count = db.prepare('SELECT COUNT(*) as c FROM schema_migrations').get() as { c: number };
console.info(`[db] migrations ok — ${count.c} applied at ${dbPath}`);
db.close();
