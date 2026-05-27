CREATE TABLE ai_integration_logs (
    id UUID PRIMARY KEY,
    try_on_session_id UUID,
    user_id UUID,
    phase VARCHAR(32) NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    model_name VARCHAR(128),
    provider VARCHAR(128),
    status VARCHAR(32),
    noteapp_request_id VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_integration_logs_created ON ai_integration_logs(created_at DESC);
CREATE INDEX idx_ai_integration_logs_session ON ai_integration_logs(try_on_session_id);
