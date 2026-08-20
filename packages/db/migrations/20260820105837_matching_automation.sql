-- v2-S1: matching drafts, audit trail, circle reminder jobs

CREATE TABLE matching_round_drafts (
  round_id TEXT PRIMARY KEY REFERENCES rounds(id) ON DELETE CASCADE,
  trios_json TEXT NOT NULL,
  unmatched_json TEXT NOT NULL,
  triggered_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE TABLE matching_audit_events (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  actor_user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_matching_audit_round ON matching_audit_events(round_id, created_at DESC);

CREATE TABLE circle_reminder_jobs (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL CHECK (kind IN ('24h', '15min')),
  run_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped', 'failed')),
  created_at TEXT NOT NULL,
  sent_at TEXT,
  UNIQUE(circle_id, user_id, kind)
);

CREATE INDEX idx_circle_reminder_jobs_due ON circle_reminder_jobs(status, run_at);
