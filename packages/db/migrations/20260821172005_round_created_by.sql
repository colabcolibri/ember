ALTER TABLE rounds ADD COLUMN created_by_user_id TEXT REFERENCES users (id);

CREATE INDEX IF NOT EXISTS idx_rounds_created_by ON rounds (created_by_user_id);
