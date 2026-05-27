ALTER TABLE try_on_jobs ADD COLUMN operation VARCHAR(64);
ALTER TABLE try_on_jobs ADD COLUMN idempotency_key VARCHAR(128);
ALTER TABLE try_on_jobs ADD COLUMN external_request_id VARCHAR(128);
ALTER TABLE try_on_jobs ADD COLUMN ai_status VARCHAR(32);
ALTER TABLE try_on_jobs ADD COLUMN priority VARCHAR(16) DEFAULT 'normal';

CREATE UNIQUE INDEX idx_try_on_jobs_idempotency ON try_on_jobs(idempotency_key);
