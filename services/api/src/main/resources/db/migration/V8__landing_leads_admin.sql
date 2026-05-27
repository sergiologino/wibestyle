ALTER TABLE landing_leads ADD COLUMN status VARCHAR(16) NOT NULL DEFAULT 'new';
ALTER TABLE landing_leads ADD COLUMN page VARCHAR(255);
ALTER TABLE landing_leads ADD COLUMN utm_source VARCHAR(128);
ALTER TABLE landing_leads ADD COLUMN utm_campaign VARCHAR(128);
ALTER TABLE landing_leads ADD COLUMN referrer VARCHAR(512);

CREATE INDEX idx_landing_leads_status ON landing_leads(status);
