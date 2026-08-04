ALTER TABLE user_profiles
    ALTER COLUMN privacy_face_hidden SET DEFAULT FALSE;

ALTER TABLE avatars
    ALTER COLUMN privacy_face_hidden SET DEFAULT FALSE;
