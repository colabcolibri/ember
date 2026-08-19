-- MVP 0 core schema + sent_emails audit table

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS communities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email_hash TEXT NOT NULL UNIQUE,
  email_vault TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rounds (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES communities (id),
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS circles (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL REFERENCES rounds (id),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sent_emails (
  id TEXT PRIMARY KEY,
  email_hash TEXT NOT NULL,
  email_vault TEXT,
  kind TEXT NOT NULL,
  subject TEXT NOT NULL,
  provider TEXT NOT NULL,
  meta_json TEXT,
  html_vault TEXT,
  text_vault TEXT,
  sent_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sent_emails_email_hash ON sent_emails (email_hash);
CREATE INDEX IF NOT EXISTS idx_sent_emails_kind ON sent_emails (kind);
CREATE INDEX IF NOT EXISTS idx_sent_emails_sent_at ON sent_emails (sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_rounds_community_id ON rounds (community_id);
CREATE INDEX IF NOT EXISTS idx_circles_round_id ON circles (round_id);
