CREATE TABLE try_on_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avatar_snapshot_id UUID REFERENCES avatar_snapshots(id),
    source_type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    visibility VARCHAR(16) NOT NULL DEFAULT 'private',
    marketplace VARCHAR(32),
    external_product_id VARCHAR(128),
    product_url VARCHAR(512),
    product_title VARCHAR(255),
    product_brand VARCHAR(120),
    product_price_rub INT,
    product_image_url VARCHAR(512),
    product_sizes VARCHAR(255),
    selected_size VARCHAR(16),
    garment_category VARCHAR(32),
    garment_photo_path VARCHAR(512),
    size_warning VARCHAR(64),
    error_code VARCHAR(64),
    error_message VARCHAR(512),
    before_image_url VARCHAR(512),
    after_image_url VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_try_on_sessions_user_id ON try_on_sessions(user_id);
CREATE INDEX idx_try_on_sessions_status ON try_on_sessions(status);

CREATE TABLE try_on_jobs (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES try_on_sessions(id) ON DELETE CASCADE,
    queue_name VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    provider VARCHAR(64),
    duration_ms INT,
    error_code VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_try_on_jobs_session_id ON try_on_jobs(session_id);
