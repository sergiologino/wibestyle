CREATE TABLE auth_refresh_tokens (
    token VARCHAR(64) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auth_refresh_tokens_user_id ON auth_refresh_tokens(user_id);
CREATE INDEX idx_auth_refresh_tokens_expires_at ON auth_refresh_tokens(expires_at);
