CREATE TABLE device_fingerprints (
    device_hash VARCHAR(64) PRIMARY KEY,
    first_seen_at TIMESTAMP NOT NULL,
    last_seen_at TIMESTAMP NOT NULL,
    first_account_created_at TIMESTAMP,
    last_account_created_at TIMESTAMP,
    last_account_deleted_at TIMESTAMP,
    registration_count INTEGER NOT NULL DEFAULT 0,
    deleted_account_count INTEGER NOT NULL DEFAULT 0,
    trial_generations_used INTEGER NOT NULL DEFAULT 0,
    trial_video_generations_used INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE user_device_links (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_hash VARCHAR(64) NOT NULL REFERENCES device_fingerprints(device_hash) ON DELETE CASCADE,
    first_seen_at TIMESTAMP NOT NULL,
    last_seen_at TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, device_hash)
);

CREATE INDEX idx_user_device_links_device_hash ON user_device_links(device_hash);

ALTER TABLE try_on_sessions ADD COLUMN device_hash VARCHAR(64);
CREATE INDEX idx_try_on_sessions_device_hash ON try_on_sessions(device_hash);
