import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ensureDatabaseReady, openDatabase, resolveDbPath, resolveRepoRoot } from './migrate.js';

describe('database migrations', () => {
  let dbPath: string;
  let db: ReturnType<typeof openDatabase>;

  afterEach(() => {
    db?.close();
    if (dbPath) {
      rmSync(dbPath);
      rmSync(join(dbPath, '..'), { recursive: true, force: true });
    }
  });

  it('resolves relative EMBER_DB_PATH from monorepo root', () => {
    const previous = process.env.EMBER_DB_PATH;
    process.env.EMBER_DB_PATH = 'data/ember.db';
    expect(resolveDbPath()).toBe(resolve(join(resolveRepoRoot(), 'data/ember.db')));
    if (previous === undefined) {
      delete process.env.EMBER_DB_PATH;
    } else {
      process.env.EMBER_DB_PATH = previous;
    }
  });

  it('applies initial schema with core tables', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ember-db-'));
    dbPath = join(dir, 'test.db');
    db = ensureDatabaseReady(dbPath);

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all() as { name: string }[];

    const names = tables.map((t) => t.name);
    expect(names).toContain('communities');
    expect(names).toContain('users');
    expect(names).toContain('rounds');
    expect(names).toContain('circles');
    expect(names).toContain('sent_emails');
    expect(names).toContain('schema_migrations');
  });
});
