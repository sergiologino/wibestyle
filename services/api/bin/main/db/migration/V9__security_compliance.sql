CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY,
    actor VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64),
    ip_address VARCHAR(64),
    details VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_audit_created_at ON admin_audit_logs(created_at DESC);

CREATE TABLE gallery_reports (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES gallery_posts(id) ON DELETE CASCADE,
    reporter_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason VARCHAR(64) NOT NULL,
    details VARCHAR(1000),
    status VARCHAR(16) NOT NULL DEFAULT 'open',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX idx_gallery_reports_status ON gallery_reports(status);
