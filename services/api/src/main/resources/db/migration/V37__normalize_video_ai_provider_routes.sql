-- Production guard for provider rows edited before video/photo route separation.
-- Photo-only networks must not be used for VIRTUAL_TRY_ON_VIDEO: FASHN tryon-max
-- rejects video-only inputs such as duration.

UPDATE ai_provider_priorities
SET network_name = 'wibestyle-season-video',
    display_name = 'Grok Imagine Video',
    updated_at = CURRENT_TIMESTAMP
WHERE operation = 'VIRTUAL_TRY_ON_VIDEO'
  AND network_name = 'wibestyle-vton'
  AND NOT EXISTS (
      SELECT 1 FROM ai_provider_priorities target
      WHERE target.operation = 'VIRTUAL_TRY_ON_VIDEO'
        AND target.network_name = 'wibestyle-season-video'
  );

DELETE FROM ai_provider_priorities
WHERE operation = 'VIRTUAL_TRY_ON_VIDEO'
  AND network_name = 'wibestyle-vton';

UPDATE ai_provider_priorities
SET network_name = 'fashn-tryon-video',
    display_name = 'FASHN Try-On Video',
    updated_at = CURRENT_TIMESTAMP
WHERE operation = 'VIRTUAL_TRY_ON_VIDEO'
  AND network_name = 'fashn-tryon-max'
  AND NOT EXISTS (
      SELECT 1 FROM ai_provider_priorities target
      WHERE target.operation = 'VIRTUAL_TRY_ON_VIDEO'
        AND target.network_name = 'fashn-tryon-video'
  );

DELETE FROM ai_provider_priorities
WHERE operation = 'VIRTUAL_TRY_ON_VIDEO'
  AND network_name = 'fashn-tryon-max';

UPDATE ai_provider_priorities
SET network_name = 'kling-tryon-video',
    display_name = 'Kling Virtual Try-On Video',
    updated_at = CURRENT_TIMESTAMP
WHERE operation = 'VIRTUAL_TRY_ON_VIDEO'
  AND network_name = 'kling-kolors-tryon'
  AND NOT EXISTS (
      SELECT 1 FROM ai_provider_priorities target
      WHERE target.operation = 'VIRTUAL_TRY_ON_VIDEO'
        AND target.network_name = 'kling-tryon-video'
  );

DELETE FROM ai_provider_priorities
WHERE operation = 'VIRTUAL_TRY_ON_VIDEO'
  AND network_name = 'kling-kolors-tryon';
