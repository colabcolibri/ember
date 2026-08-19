-- Entrega de círculos: Jitsi, agenda e pós-encontro (v1-S4)

ALTER TABLE circles ADD COLUMN jitsi_url TEXT;
ALTER TABLE circles ADD COLUMN scheduled_at TEXT;

ALTER TABLE circle_members ADD COLUMN attendance TEXT;
ALTER TABLE circle_members ADD COLUMN attendance_at TEXT;
