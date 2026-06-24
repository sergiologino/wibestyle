ALTER TABLE user_profiles
    ALTER COLUMN trial_generations_left SET DEFAULT 3;

UPDATE user_profiles
SET trial_generations_left = 3
WHERE plan = 'trial'
  AND trial_generations_left > 3;
