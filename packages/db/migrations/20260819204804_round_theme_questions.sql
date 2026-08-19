-- Round theme and shared questions (v1-S7 / US-0035)

ALTER TABLE rounds ADD COLUMN theme TEXT;
ALTER TABLE rounds ADD COLUMN questions_json TEXT;
