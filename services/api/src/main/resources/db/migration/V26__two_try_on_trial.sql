ALTER TABLE user_profiles
    ALTER COLUMN trial_generations_left SET DEFAULT 2;

UPDATE user_profiles
SET trial_generations_left = 2
WHERE plan = 'trial'
  AND trial_generations_left > 2;
