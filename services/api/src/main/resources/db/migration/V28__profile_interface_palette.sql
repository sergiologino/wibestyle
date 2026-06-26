ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS interface_palette VARCHAR(24) NOT NULL DEFAULT 'vibe';

UPDATE user_profiles
SET interface_palette = 'vibe'
WHERE interface_palette IS NULL OR interface_palette = '';
