-- Auth, profiles and round presence (v1-S2)

CREATE TABLE IF NOT EXISTS auth_magic_tokens (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  email_hash TEXT NOT NULL,
  email_vault TEXT,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_magic_tokens_hash ON auth_magic_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_magic_tokens_expires ON auth_magic_tokens (expires_at);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS community_members (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES communities (id),
  user_id TEXT NOT NULL REFERENCES users (id),
  role TEXT NOT NULL DEFAULT 'member',
  created_at TEXT NOT NULL,
  UNIQUE (community_id, user_id)
);

CREATE TABLE IF NOT EXISTS member_profiles (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES communities (id),
  user_id TEXT NOT NULL REFERENCES users (id),
  timezone TEXT,
  languages_json TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE (community_id, user_id)
);

CREATE TABLE IF NOT EXISTS round_declarations (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL REFERENCES rounds (id),
  user_id TEXT NOT NULL REFERENCES users (id),
  slots_json TEXT NOT NULL,
  intention TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (round_id, user_id)
);

-- Seed piloto GSA + rodada aberta para dev
INSERT OR IGNORE INTO communities (id, name, slug, created_at)
VALUES ('comm-gsa', 'GSA Piloto', 'gsa-pilot', datetime('now'));

INSERT OR IGNORE INTO rounds (id, community_id, status, created_at)
VALUES ('round-open-1', 'comm-gsa', 'open', datetime('now'));
