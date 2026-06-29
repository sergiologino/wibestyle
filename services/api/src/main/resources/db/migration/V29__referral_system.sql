ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS bonus_generations_left INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS referral_accounts (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(16) NOT NULL UNIQUE,
    referred_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    referred_at TIMESTAMP,
    first_paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_referral_accounts_referred_by
    ON referral_accounts(referred_by_user_id);

CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY,
    referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checkout_id UUID NOT NULL REFERENCES billing_checkouts(id) ON DELETE CASCADE,
    billing_period VARCHAR(16) NOT NULL,
    reward_generations INTEGER NOT NULL,
    friend_label VARCHAR(160) NOT NULL,
    rewarded_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_referral_reward_referred_user UNIQUE (referred_user_id),
    CONSTRAINT uq_referral_reward_checkout UNIQUE (checkout_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer_time
    ON referral_rewards(referrer_user_id, rewarded_at DESC);
