CREATE TABLE hairstyle_catalog (
  id UUID PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(160) NOT NULL,
  description VARCHAR(600) NOT NULL,
  hair_type VARCHAR(16) NOT NULL,
  master_note VARCHAR(600) NOT NULL,
  ai_directive VARCHAR(600) NOT NULL,
  image_path VARCHAR(512) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_hairstyle_catalog_active_sort ON hairstyle_catalog(active, sort_order);
