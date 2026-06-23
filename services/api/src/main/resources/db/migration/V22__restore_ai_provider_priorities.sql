INSERT INTO ai_provider_priorities (id, operation, network_name, display_name, priority_order, enabled, updated_at)
SELECT '00000000-0000-0000-0000-000000020001', 'VIRTUAL_TRY_ON_PHOTO', 'wibestyle-vton', 'Grok Imagine', 10, TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM ai_provider_priorities
    WHERE operation = 'VIRTUAL_TRY_ON_PHOTO' AND network_name = 'wibestyle-vton'
);

INSERT INTO ai_provider_priorities (id, operation, network_name, display_name, priority_order, enabled, updated_at)
SELECT '00000000-0000-0000-0000-000000020002', 'VIRTUAL_TRY_ON_PHOTO', 'fashn-try-on-photo', 'FASHN Try-On Photo', 20, TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM ai_provider_priorities
    WHERE operation = 'VIRTUAL_TRY_ON_PHOTO' AND network_name = 'fashn-try-on-photo'
);

INSERT INTO ai_provider_priorities (id, operation, network_name, display_name, priority_order, enabled, updated_at)
SELECT '00000000-0000-0000-0000-000000020003', 'VIRTUAL_TRY_ON_PHOTO', 'kling-try-on-photo', 'Kling Virtual Try-On', 30, TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM ai_provider_priorities
    WHERE operation = 'VIRTUAL_TRY_ON_PHOTO' AND network_name = 'kling-try-on-photo'
);

INSERT INTO ai_provider_priorities (id, operation, network_name, display_name, priority_order, enabled, updated_at)
SELECT '00000000-0000-0000-0000-000000020004', 'VIRTUAL_TRY_ON_VIDEO', 'wibestyle-season-video', 'Grok Imagine Video', 10, TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM ai_provider_priorities
    WHERE operation = 'VIRTUAL_TRY_ON_VIDEO' AND network_name = 'wibestyle-season-video'
);

INSERT INTO ai_provider_priorities (id, operation, network_name, display_name, priority_order, enabled, updated_at)
SELECT '00000000-0000-0000-0000-000000020005', 'VIRTUAL_TRY_ON_VIDEO', 'fashn-try-on-video', 'FASHN Try-On Video', 20, TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM ai_provider_priorities
    WHERE operation = 'VIRTUAL_TRY_ON_VIDEO' AND network_name = 'fashn-try-on-video'
);

INSERT INTO ai_provider_priorities (id, operation, network_name, display_name, priority_order, enabled, updated_at)
SELECT '00000000-0000-0000-0000-000000020006', 'VIRTUAL_TRY_ON_VIDEO', 'kling-try-on-video', 'Kling Virtual Try-On Video', 30, TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM ai_provider_priorities
    WHERE operation = 'VIRTUAL_TRY_ON_VIDEO' AND network_name = 'kling-try-on-video'
);

UPDATE ai_provider_priorities
SET display_name = 'Grok Imagine', updated_at = CURRENT_TIMESTAMP
WHERE operation = 'VIRTUAL_TRY_ON_PHOTO'
  AND network_name = 'wibestyle-vton'
  AND display_name = 'WibeStyle Virtual Try-On';

UPDATE ai_provider_priorities
SET display_name = 'Kling Virtual Try-On', updated_at = CURRENT_TIMESTAMP
WHERE operation = 'VIRTUAL_TRY_ON_PHOTO'
  AND network_name = 'kling-try-on-photo'
  AND display_name = 'Kling Try-On Photo';
