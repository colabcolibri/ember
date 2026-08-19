-- Member origin and residence places (v1-S7 / US-0039)

ALTER TABLE member_profiles ADD COLUMN origin_place_json TEXT;
ALTER TABLE member_profiles ADD COLUMN residence_place_json TEXT;
