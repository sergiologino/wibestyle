CREATE TABLE media_assets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose VARCHAR(32) NOT NULL,
    content_type VARCHAR(64),
    stored_path VARCHAR(512),
    status VARCHAR(16) NOT NULL DEFAULT 'pending',
    upload_token VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_media_assets_user ON media_assets(user_id);

CREATE TABLE landing_interests (
    id UUID PRIMARY KEY,
    email_or_phone VARCHAR(255) NOT NULL,
    interest VARCHAR(64),
    page VARCHAR(255),
    utm_source VARCHAR(128),
    utm_campaign VARCHAR(128),
    referrer VARCHAR(512),
    consent BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    try_on_session_id UUID REFERENCES try_on_sessions(id) ON DELETE SET NULL,
    rating INT NOT NULL,
    body VARCHAR(2000) NOT NULL,
    display_name VARCHAR(120),
    allow_publish BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(16) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

CREATE INDEX idx_reviews_status ON reviews(status);

CREATE TABLE billing_checkouts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(16) NOT NULL,
    billing_period VARCHAR(16) NOT NULL,
    price_rub INT NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'pending',
    provider VARCHAR(32) NOT NULL DEFAULT 'mock',
    external_payment_id VARCHAR(128),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_billing_checkouts_user ON billing_checkouts(user_id);
