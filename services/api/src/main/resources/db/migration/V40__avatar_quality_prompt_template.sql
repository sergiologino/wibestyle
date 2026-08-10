INSERT INTO ai_prompt_templates (template_key, title, description, body)
SELECT
    'avatar.quality_analysis',
    'Аватар — анализ фото перед примеркой',
    'Промпт проверки фото аватара. Возвращает JSON с quality, warnings и message. {photoFingerprint} заменяется автоматически.',
    'Analyze whether this image is suitable as a private avatar for a virtual clothing try-on app.
Requirements: exactly one real person, visible full body or at least from head to knees, person should occupy a useful part of the frame, upright orientation, not only a head/portrait, not a tiny figure in a landscape, not multiple people.
Return needs_new_photo only for no person, multiple people, head-only crop, tiny body, wrong orientation, or objectively too-low image resolution.
Important: a busy garden/nature/city/home background, patterned clothing, colorful dress, imperfect lighting, mild softness, or mild lack of detail is recoverable. For those cases return usable with warnings, not needs_new_photo; the app can improve the photo after upload.
This is an independent validation request for image fingerprint {photoFingerprint}. Analyze only the image attached to this request; do not reuse any conclusion from another image.
Return JSON:
{"quality":"good|usable|needs_new_photo","warnings":["NO_PERSON|MULTIPLE_PEOPLE|HEAD_ONLY|BODY_TOO_SMALL|BUSY_BACKGROUND|SIDEWAYS_OR_UPSIDE_DOWN|POOR_LIGHTING|LOW_DETAIL"],"message":"one short Russian user-facing sentence, supportive tone, no words bad/poor/rejected"}'
WHERE NOT EXISTS (
    SELECT 1 FROM ai_prompt_templates WHERE template_key = 'avatar.quality_analysis'
);
