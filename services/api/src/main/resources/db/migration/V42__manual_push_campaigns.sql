CREATE TABLE manual_push_campaigns (
    id UUID PRIMARY KEY,
    title VARCHAR(80) NOT NULL,
    body VARCHAR(240) NOT NULL,
    action_url VARCHAR(512),
    audience VARCHAR(32) NOT NULL,
    status VARCHAR(24) NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    targeted_users INT NOT NULL DEFAULT 0,
    queued_users INT NOT NULL DEFAULT 0,
    accepted_users INT NOT NULL DEFAULT 0,
    error_users INT NOT NULL DEFAULT 0,
    no_device_users INT NOT NULL DEFAULT 0,
    last_error VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    finished_at TIMESTAMP
);

CREATE INDEX idx_manual_push_campaigns_status_schedule
    ON manual_push_campaigns(status, scheduled_at);

CREATE TABLE manual_push_recipients (
    id UUID PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES manual_push_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(24) NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMP NOT NULL,
    last_attempt_at TIMESTAMP,
    accepted_at TIMESTAMP,
    last_error VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ux_manual_push_recipient UNIQUE (campaign_id, user_id)
);

CREATE INDEX idx_manual_push_recipients_queue
    ON manual_push_recipients(status, next_attempt_at);

CREATE INDEX idx_manual_push_recipients_campaign
    ON manual_push_recipients(campaign_id, status);
