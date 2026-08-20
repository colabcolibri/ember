-- Member response on round presence: attending or declined

ALTER TABLE round_declarations ADD COLUMN response TEXT NOT NULL DEFAULT 'attending';

CREATE INDEX IF NOT EXISTS idx_round_declarations_response ON round_declarations (round_id, response);
