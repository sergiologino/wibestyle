CREATE TABLE hair_color_catalog (
  id UUID PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(160) NOT NULL,
  family VARCHAR(40) NOT NULL,
  description VARCHAR(600) NOT NULL,
  ai_directive VARCHAR(600) NOT NULL,
  image_path VARCHAR(512) NOT NULL,
  source_brand VARCHAR(120) NOT NULL,
  source_url VARCHAR(700) NOT NULL,
  attribution_text VARCHAR(500) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_hair_color_catalog_active_sort ON hair_color_catalog(active, sort_order);
