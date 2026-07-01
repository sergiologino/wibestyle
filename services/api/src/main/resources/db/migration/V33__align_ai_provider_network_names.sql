-- Align WibeStyle routes with the canonical names seeded by noteapp-ai-integration.
-- Preserve the priority and enabled state configured by the administrator.

UPDATE ai_provider_priorities
SET network_name = 'fashn-tryon-max',
    updated_at = CURRENT_TIMESTAMP
WHERE operation = 'VIRTUAL_TRY_ON_PHOTO'
  AND network_name = 'fashn-try-on-photo'
  AND NOT EXISTS (
      SELECT 1
      FROM ai_provider_priorities target
      WHERE target.operation = 'VIRTUAL_TRY_ON_PHOTO'
        AND target.network_name = 'fashn-tryon-max'
  );

DELETE FROM ai_provider_priorities
WHERE operation = 'VIRTUAL_TRY_ON_PHOTO'
  AND network_name = 'fashn-try-on-photo';

UPDATE ai_provider_priorities
SET network_name = 'kling-kolors-tryon',
    updated_at = CURRENT_TIMESTAMP
WHERE operation = 'VIRTUAL_TRY_ON_PHOTO'
  AND network_name = 'kling-try-on-photo'
  AND NOT EXISTS (
      SELECT 1
      FROM ai_provider_priorities target
      WHERE target.operation = 'VIRTUAL_TRY_ON_PHOTO'
        AND target.network_name = 'kling-kolors-tryon'
  );

DELETE FROM ai_provider_priorities
WHERE operation = 'VIRTUAL_TRY_ON_PHOTO'
  AND network_name = 'kling-try-on-photo';

UPDATE ai_provider_priorities
SET network_name = 'fashn-tryon-video',
    updated_at = CURRENT_TIMESTAMP
WHERE operation = 'VIRTUAL_TRY_ON_VIDEO'
  AND network_name = 'fashn-try-on-video'
  AND NOT EXISTS (
      SELECT 1
      FROM ai_provider_priorities target
      WHERE target.operation = 'VIRTUAL_TRY_ON_VIDEO'
        AND target.network_name = 'fashn-tryon-video'
  );

DELETE FROM ai_provider_priorities
WHERE operation = 'VIRTUAL_TRY_ON_VIDEO'
  AND network_name = 'fashn-try-on-video';

UPDATE ai_provider_priorities
SET network_name = 'kling-tryon-video',
    updated_at = CURRENT_TIMESTAMP
WHERE operation = 'VIRTUAL_TRY_ON_VIDEO'
  AND network_name = 'kling-try-on-video'
  AND NOT EXISTS (
      SELECT 1
      FROM ai_provider_priorities target
      WHERE target.operation = 'VIRTUAL_TRY_ON_VIDEO'
        AND target.network_name = 'kling-tryon-video'
  );

DELETE FROM ai_provider_priorities
WHERE operation = 'VIRTUAL_TRY_ON_VIDEO'
  AND network_name = 'kling-try-on-video';
