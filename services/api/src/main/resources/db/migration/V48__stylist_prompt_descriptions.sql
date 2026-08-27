UPDATE ai_prompt_templates
SET description = 'Редактируемая текстовая часть для мягкого анализа аватара. Система дописывает событие, дату, антропометрию и технические ограничения.'
WHERE template_key = 'stylist.avatar_analysis_ru';

UPDATE ai_prompt_templates
SET description = 'Редактируемая текстовая часть для подбора трех направлений образа. Система дописывает пресет, дату, сезон, антропометрию и технические ограничения.'
WHERE template_key = 'stylist.trends_ru';
