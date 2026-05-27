ALTER TABLE try_on_sessions ADD COLUMN recommended_size VARCHAR(16);
ALTER TABLE try_on_sessions ADD COLUMN size_fit_status VARCHAR(32);
ALTER TABLE try_on_sessions ADD COLUMN size_fit_message VARCHAR(512);
