-- Calendários regionais de slots (US-0036)

CREATE TABLE IF NOT EXISTS slot_calendars (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES communities (id),
  label TEXT NOT NULL,
  anchor_timezone TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (community_id, label)
);

CREATE TABLE IF NOT EXISTS slot_calendar_entries (
  id TEXT PRIMARY KEY,
  calendar_id TEXT NOT NULL REFERENCES slot_calendars (id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  minute INTEGER NOT NULL DEFAULT 0 CHECK (minute >= 0 AND minute <= 59),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_slot_calendar_entries_calendar ON slot_calendar_entries (calendar_id);

INSERT OR IGNORE INTO slot_calendars (id, community_id, label, anchor_timezone, created_at)
VALUES
  ('cal-americas', 'comm-gsa', 'Americas', 'America/Sao_Paulo', datetime('now')),
  ('cal-europe', 'comm-gsa', 'Europe', 'Europe/Lisbon', datetime('now'));

INSERT OR IGNORE INTO slot_calendar_entries (id, calendar_id, weekday, hour, minute, sort_order)
VALUES
  ('slot-mon-1900', 'cal-americas', 1, 19, 0, 1),
  ('slot-tue-1900', 'cal-americas', 2, 19, 0, 2),
  ('slot-wed-1900', 'cal-americas', 3, 19, 0, 3),
  ('slot-thu-1900', 'cal-americas', 4, 19, 0, 4),
  ('slot-sat-1000', 'cal-americas', 6, 10, 0, 5),
  ('slot-sun-1300', 'cal-europe', 0, 13, 0, 1),
  ('slot-wed-1900-eu', 'cal-europe', 3, 19, 0, 2),
  ('slot-sat-1000-eu', 'cal-europe', 6, 10, 0, 3);
