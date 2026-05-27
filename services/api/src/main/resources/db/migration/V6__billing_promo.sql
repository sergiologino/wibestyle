ALTER TABLE user_profiles
    ADD COLUMN plan_generations_left INT NOT NULL DEFAULT 0;

ALTER TABLE user_profiles
    ADD COLUMN billing_period VARCHAR(16);

ALTER TABLE user_profiles
    ADD COLUMN subscription_expires_at TIMESTAMP;

ALTER TABLE user_profiles
    ADD COLUMN active_promo_code_id UUID;

ALTER TABLE user_profiles
    ADD COLUMN promo_discount_percent INT;

ALTER TABLE try_on_sessions
    ADD COLUMN quota_reserved BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE try_on_sessions
    ADD COLUMN quota_consumed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE promo_codes (
    id UUID PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    discount_percent INT NOT NULL,
    max_uses INT NOT NULL,
    uses_count INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    label VARCHAR(120),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE promo_code_redemptions (
    id UUID PRIMARY KEY,
    promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_promo_user UNIQUE (promo_code_id, user_id)
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_redemptions_user ON promo_code_redemptions(user_id);
