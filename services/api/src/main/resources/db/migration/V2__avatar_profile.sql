ALTER TABLE user_profiles ADD COLUMN clothing_size VARCHAR(8);
ALTER TABLE user_profiles ADD COLUMN profile_type VARCHAR(16);
ALTER TABLE user_profiles ADD COLUMN sizing_system VARCHAR(16);
ALTER TABLE user_profiles ADD COLUMN privacy_face_hidden BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE user_profiles ADD COLUMN privacy_background_hidden BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN privacy_features_hidden BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE avatars (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    photo_original_path VARCHAR(512),
    photo_processed_path VARCHAR(512),
    quality_score DOUBLE PRECISION,
    quality_warnings VARCHAR(2000),
    privacy_face_hidden BOOLEAN NOT NULL DEFAULT TRUE,
    privacy_background_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    privacy_features_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    pipeline_version VARCHAR(16) NOT NULL DEFAULT 'v1',
    exif_removed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_avatars_user_id ON avatars(user_id);

CREATE TABLE avatar_snapshots (
    id UUID PRIMARY KEY,
    avatar_id UUID NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    height_cm INT,
    bust_cm INT,
    waist_cm INT,
    hips_cm INT,
    shoe_size_eu INT,
    clothing_size VARCHAR(8),
    processed_image_path VARCHAR(512),
    privacy_face_hidden BOOLEAN NOT NULL,
    privacy_background_hidden BOOLEAN NOT NULL,
    privacy_features_hidden BOOLEAN NOT NULL,
    quality_score DOUBLE PRECISION,
    pipeline_version VARCHAR(16) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_avatar_snapshots_user_id ON avatar_snapshots(user_id);
