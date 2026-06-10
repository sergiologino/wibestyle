CREATE TABLE platform_settings (
    setting_key VARCHAR(64) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO platform_settings (setting_key, setting_value, updated_at)
VALUES ('block_google_oauth', 'false', CURRENT_TIMESTAMP);
