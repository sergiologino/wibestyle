ALTER TABLE favorites
    ADD COLUMN IF NOT EXISTS try_on_session_id UUID;

CREATE INDEX IF NOT EXISTS idx_favorites_try_on_session_id
    ON favorites (try_on_session_id);
