-- Facilitador, templates, círculos e memória de matching (v1-S3)

CREATE TABLE IF NOT EXISTS meeting_templates (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES communities (id),
  name TEXT NOT NULL,
  circle_size INTEGER NOT NULL DEFAULT 3,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TEXT NOT NULL
);

ALTER TABLE rounds ADD COLUMN question TEXT;
ALTER TABLE rounds ADD COLUMN slots_json TEXT;
ALTER TABLE rounds ADD COLUMN template_id TEXT REFERENCES meeting_templates (id);

ALTER TABLE circles ADD COLUMN status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE circles ADD COLUMN scheduled_slot TEXT;

CREATE TABLE IF NOT EXISTS circle_members (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL REFERENCES circles (id),
  user_id TEXT NOT NULL REFERENCES users (id),
  status TEXT NOT NULL DEFAULT 'invited',
  created_at TEXT NOT NULL,
  UNIQUE (circle_id, user_id)
);

CREATE TABLE IF NOT EXISTS meeting_participations (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES communities (id),
  circle_id TEXT NOT NULL REFERENCES circles (id),
  user_id TEXT NOT NULL REFERENCES users (id),
  partner_user_id TEXT NOT NULL REFERENCES users (id),
  met_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_circle_members_circle ON circle_members (circle_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participations_user ON meeting_participations (user_id, community_id);

INSERT OR IGNORE INTO meeting_templates (id, community_id, name, circle_size, duration_minutes, created_at)
VALUES (
  'tpl-gsa-fogo',
  'comm-gsa',
  'Fogo de Conselho',
  3,
  30,
  datetime('now')
);

-- Rodada seed passa a draft — facilitador cria via API
UPDATE rounds SET status = 'closed' WHERE id = 'round-open-1';
