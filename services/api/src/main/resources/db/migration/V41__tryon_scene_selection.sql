ALTER TABLE try_on_sessions ADD COLUMN IF NOT EXISTS scene_preset VARCHAR(32);
ALTER TABLE try_on_sessions ADD COLUMN IF NOT EXISTS custom_scene VARCHAR(512);
