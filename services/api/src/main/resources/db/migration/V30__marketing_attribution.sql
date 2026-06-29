CREATE TABLE marketing_channels (
    id UUID PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    display_name VARCHAR(160) NOT NULL,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    description VARCHAR(500),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_marketing_channels_source_medium
    ON marketing_channels(utm_source, utm_medium);

CREATE TABLE marketing_visits (
    id UUID PRIMARY KEY,
    visitor_id VARCHAR(64) NOT NULL,
    channel_id UUID REFERENCES marketing_channels(id) ON DELETE SET NULL,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(200),
    utm_content VARCHAR(300),
    utm_term VARCHAR(300),
    yclid VARCHAR(300),
    ysclid VARCHAR(300),
    gclid VARCHAR(300),
    fbclid VARCHAR(300),
    vk_click_id VARCHAR(300),
    landing_url VARCHAR(2000),
    referrer VARCHAR(2000),
    ip_hash VARCHAR(64),
    user_agent_hash VARCHAR(64),
    client_created_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_marketing_visits_visitor_id ON marketing_visits(visitor_id);
CREATE INDEX idx_marketing_visits_utm ON marketing_visits(utm_source, utm_medium, utm_campaign);
CREATE INDEX idx_marketing_visits_created_at ON marketing_visits(created_at);

CREATE TABLE marketing_events (
    id UUID PRIMARY KEY,
    visitor_id VARCHAR(64),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    metadata_json TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_marketing_events_visitor_id ON marketing_events(visitor_id);
CREATE INDEX idx_marketing_events_user_id ON marketing_events(user_id);
CREATE INDEX idx_marketing_events_event_type ON marketing_events(event_type);
CREATE INDEX idx_marketing_events_created_at ON marketing_events(created_at);

ALTER TABLE users ADD COLUMN visitor_id VARCHAR(64);
ALTER TABLE users ADD COLUMN first_marketing_visit_id UUID REFERENCES marketing_visits(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN last_marketing_visit_id UUID REFERENCES marketing_visits(id) ON DELETE SET NULL;

CREATE INDEX idx_users_visitor_id ON users(visitor_id);
CREATE INDEX idx_users_first_marketing_visit ON users(first_marketing_visit_id);

INSERT INTO marketing_channels
    (id, code, display_name, utm_source, utm_medium, description, enabled, created_at, updated_at)
VALUES
    ('00000000-0000-0000-0000-000000000101', 'yandex_direct', 'Яндекс Директ', 'ya', 'cpc', 'Контекстная реклама Яндекс Директа', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000102', 'instagram_reels', 'Instagram / Reels', 'instagram', 'paid_social', 'Платные короткие видео', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000103', 'telegram', 'Telegram', 'telegram', 'messenger', 'Telegram-каналы и публикации', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000104', 'vk_articles', 'VK / статьи', 'vk', 'article', 'Статьи в сообществах VK', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000105', 'vk_organic', 'VK / органика', 'vk', 'organic_social', 'Органические публикации VK', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
