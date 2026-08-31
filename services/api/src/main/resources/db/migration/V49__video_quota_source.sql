ALTER TABLE try_on_sessions
    ADD COLUMN IF NOT EXISTS video_quota_source VARCHAR(32);
