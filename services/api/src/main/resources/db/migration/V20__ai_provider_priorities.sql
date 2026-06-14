CREATE TABLE ai_provider_priorities (
    id UUID PRIMARY KEY,
    operation VARCHAR(64) NOT NULL,
    network_name VARCHAR(128) NOT NULL,
    display_name VARCHAR(160) NOT NULL,
    priority_order INT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ai_provider_priorities_operation_network UNIQUE (operation, network_name)
);

CREATE INDEX idx_ai_provider_priorities_operation_priority
    ON ai_provider_priorities(operation, enabled, priority_order);

ALTER TABLE ai_integration_logs ADD COLUMN operation VARCHAR(64);
ALTER TABLE ai_integration_logs ADD COLUMN attempt_number INT;
ALTER TABLE ai_integration_logs ADD COLUMN fallback_reason VARCHAR(255);

INSERT INTO ai_provider_priorities (id, operation, network_name, display_name, priority_order, enabled, updated_at)
VALUES
    ('00000000-0000-0000-0000-000000020001', 'VIRTUAL_TRY_ON_PHOTO', 'wibestyle-vton', 'WibeStyle Virtual Try-On', 10, TRUE, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000020002', 'VIRTUAL_TRY_ON_PHOTO', 'fashn-try-on-photo', 'FASHN Try-On Photo', 20, TRUE, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000020003', 'VIRTUAL_TRY_ON_PHOTO', 'kling-try-on-photo', 'Kling Try-On Photo', 30, TRUE, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000020004', 'VIRTUAL_TRY_ON_VIDEO', 'wibestyle-season-video', 'WibeStyle Season Hit Video', 10, TRUE, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000020005', 'VIRTUAL_TRY_ON_VIDEO', 'fashn-try-on-video', 'FASHN Try-On Video', 20, TRUE, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000020006', 'VIRTUAL_TRY_ON_VIDEO', 'kling-try-on-video', 'Kling Try-On Video', 30, TRUE, CURRENT_TIMESTAMP);
