CREATE TABLE users (
    id UUID PRIMARY KEY,
    phone VARCHAR(32) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(120),
    gender VARCHAR(16),
    plan VARCHAR(16) NOT NULL DEFAULT 'trial',
    trial_generations_left INT NOT NULL DEFAULT 5,
    height_cm INT,
    weight_kg INT,
    bust_cm INT,
    waist_cm INT,
    hips_cm INT,
    shoe_size_eu INT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE landing_leads (
    id UUID PRIMARY KEY,
    spot_number INT NOT NULL,
    has_discount BOOLEAN NOT NULL,
    price_annual INT NOT NULL,
    price_with_discount INT NOT NULL,
    name VARCHAR(120),
    phone_or_email VARCHAR(255) NOT NULL,
    gender VARCHAR(16),
    favorite_marketplace VARCHAR(64),
    interest VARCHAR(32),
    consent BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_landing_leads_created_at ON landing_leads(created_at DESC);
