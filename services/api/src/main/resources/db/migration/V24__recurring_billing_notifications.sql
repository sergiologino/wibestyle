ALTER TABLE billing_checkouts ADD COLUMN save_payment_method BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE billing_checkouts ADD COLUMN checkout_type VARCHAR(16) NOT NULL DEFAULT 'initial';
ALTER TABLE billing_checkouts ADD COLUMN renewal_key VARCHAR(160);

CREATE UNIQUE INDEX ux_billing_checkouts_renewal_key
    ON billing_checkouts(renewal_key);

CREATE TABLE billing_subscriptions (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(16) NOT NULL,
    billing_period VARCHAR(16) NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    auto_renew_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    provider VARCHAR(32) NOT NULL,
    provider_payment_method_id VARCHAR(128),
    status VARCHAR(24) NOT NULL DEFAULT 'active',
    renewal_failure_count INT NOT NULL DEFAULT 0,
    next_renewal_attempt_at TIMESTAMP,
    warning_sent_for TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_billing_subscriptions_renewal
    ON billing_subscriptions(auto_renew_enabled, current_period_end, next_renewal_attempt_at);

CREATE TABLE user_notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(40) NOT NULL,
    title VARCHAR(160) NOT NULL,
    body VARCHAR(1000) NOT NULL,
    action_url VARCHAR(512),
    dedupe_key VARCHAR(200) NOT NULL,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ux_user_notifications_dedupe UNIQUE (user_id, dedupe_key)
);

CREATE INDEX idx_user_notifications_user_created
    ON user_notifications(user_id, created_at);

CREATE TABLE push_devices (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expo_push_token VARCHAR(255) NOT NULL UNIQUE,
    platform VARCHAR(16) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_push_devices_user_enabled ON push_devices(user_id, enabled);
