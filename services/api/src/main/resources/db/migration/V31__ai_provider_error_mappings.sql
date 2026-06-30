CREATE TABLE ai_provider_error_mappings (
    id UUID PRIMARY KEY,
    error_text VARCHAR(1000) NOT NULL,
    description VARCHAR(1500) NOT NULL,
    error_code VARCHAR(64) NOT NULL DEFAULT 'VTON_CONTENT_MODERATION',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ai_provider_error_mappings_text UNIQUE (error_text)
);

CREATE INDEX idx_ai_provider_error_mappings_enabled
    ON ai_provider_error_mappings(enabled);

INSERT INTO ai_provider_error_mappings (
    id,
    error_text,
    description,
    error_code,
    enabled,
    created_at,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000031001',
    'Generated image rejected by content moderation.',
    'Нейросеть отклонила примерку из-за автоматической модерации: вещь могла быть распознана как одежда эротического или интимного характера. Примерка не списана с вашего баланса. Попробуйте выбрать другую вещь.',
    'VTON_CONTENT_MODERATION',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
