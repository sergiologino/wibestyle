ALTER TABLE push_devices
    ADD COLUMN provider VARCHAR(16) NOT NULL DEFAULT 'expo';

CREATE INDEX IF NOT EXISTS idx_push_devices_provider_user_enabled
    ON push_devices(provider, user_id, enabled);
