ALTER TABLE user_profiles
    ALTER COLUMN trial_generations_left SET DEFAULT 3;

UPDATE user_profiles
SET trial_generations_left = CASE
    WHEN trial_generations_left < 3 THEN trial_generations_left + 1
    ELSE 3
END
WHERE plan = 'trial';

ALTER TABLE user_profiles
    ADD COLUMN trial_video_generations_left INT NOT NULL DEFAULT 1;

ALTER TABLE try_on_sessions
    ADD COLUMN video_quota_reserved BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE try_on_sessions
    ADD COLUMN video_quota_consumed BOOLEAN NOT NULL DEFAULT FALSE;
