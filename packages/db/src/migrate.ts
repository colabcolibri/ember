import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function resolveDbPath(): string {
  const fromEnv = process.env.EMBER_DB_PATH?.trim();
  if (fromEnv) {
    return resolve(fromEnv);
  }
  return resolve(process.cwd(), 'data/ember.db');
}

export function resolveMigrationsDir(): string {
  return join(packageRoot, 'migrations');
}

export function openDatabase(dbPath = resolveDbPath()): Database.Database {
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function migrateDatabase(db: Database.Database, migrationsDir = resolveMigrationsDir()): string[] {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set(
    (db.prepare('SELECT id FROM schema_migrations').all() as { id: string }[]).map((row) => row.id),
  );

  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  const newlyApplied: string[] = [];

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    db.exec(sql);
    db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(
      file,
      new Date().toISOString(),
    );
    newlyApplied.push(file);
  }

  return newlyApplied;
}

export function ensureDatabaseReady(dbPath?: string): Database.Database {
  const db = openDatabase(dbPath);
  migrateDatabase(db);
  return db;
}
