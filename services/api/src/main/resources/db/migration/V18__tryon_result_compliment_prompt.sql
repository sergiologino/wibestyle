ALTER TABLE try_on_sessions ADD COLUMN IF NOT EXISTS style_compliment VARCHAR(512);

INSERT INTO ai_prompt_templates (template_key, title, description, body)
SELECT
    'tryon.result_compliment_ru',
    'Примерка — комплимент результата',
    'Короткий текст после готовой примерки. Система передаёт товар, размер, тариф и подсказки share/subscription.',
    'Ты fashion-стилист WibeStyle. Напиши один короткий комплимент на русском для экрана результата примерки (до 150 символов). Тон: тёплый, современный, без фамильярности и стереотипов. Не оценивай тело грубо, не упоминай вес, не обещай покупку. Если shareHint=true — естественно предложи поделиться образом с подругой. Если freePlan=true — мягко предложи закрепить стиль подпиской. Без кавычек, без emoji.'
WHERE NOT EXISTS (
    SELECT 1 FROM ai_prompt_templates WHERE template_key = 'tryon.result_compliment_ru'
);
