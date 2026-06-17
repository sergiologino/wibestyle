ALTER TABLE try_on_sessions ADD COLUMN IF NOT EXISTS garment_prompt_profile VARCHAR(32);
ALTER TABLE try_on_sessions ADD COLUMN IF NOT EXISTS garment_coverage_level VARCHAR(32);
ALTER TABLE try_on_sessions ADD COLUMN IF NOT EXISTS garment_moderation_risk VARCHAR(32);
ALTER TABLE try_on_sessions ADD COLUMN IF NOT EXISTS garment_has_human_model BOOLEAN NOT NULL DEFAULT FALSE;
