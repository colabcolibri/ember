-- Member profile identity fields (v1-S6 / US-0034)

ALTER TABLE member_profiles ADD COLUMN display_name TEXT;
ALTER TABLE member_profiles ADD COLUMN edition_year INTEGER;
