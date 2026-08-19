import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ensureDatabaseReady, openDatabase } from './migrate.js';

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
