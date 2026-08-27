ALTER TABLE users
    ADD COLUMN stylist_focus_group BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE stylist_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avatar_snapshot_id UUID NOT NULL REFERENCES avatar_snapshots(id),
    preset_id VARCHAR(64) NOT NULL,
    preset_title VARCHAR(120) NOT NULL,
    season VARCHAR(32) NOT NULL,
    avatar_analysis TEXT,
    trend_note TEXT,
    status VARCHAR(32) NOT NULL,
    selected_variant_id VARCHAR(32),
    error_code VARCHAR(64),
    error_message VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stylist_sessions_user_id ON stylist_sessions(user_id);
CREATE INDEX idx_stylist_sessions_created_at ON stylist_sessions(created_at);

CREATE TABLE stylist_variants (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES stylist_sessions(id) ON DELETE CASCADE,
    variant_key VARCHAR(32) NOT NULL,
    title VARCHAR(120) NOT NULL,
    summary VARCHAR(512) NOT NULL,
    style_direction VARCHAR(512) NOT NULL,
    stylist_comment TEXT,
    product_search_status VARCHAR(32) NOT NULL DEFAULT 'demo',
    product_search_query VARCHAR(512),
    preview_status VARCHAR(32) NOT NULL,
    preview_image_path VARCHAR(512),
    preview_image_url VARCHAR(512),
    provider VARCHAR(64),
    external_request_id VARCHAR(128),
    error_code VARCHAR(64),
    error_message VARCHAR(512),
    sort_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stylist_variants_session_id ON stylist_variants(session_id);
CREATE UNIQUE INDEX idx_stylist_variants_session_key ON stylist_variants(session_id, variant_key);

CREATE TABLE stylist_products (
    id UUID PRIMARY KEY,
    variant_id UUID NOT NULL REFERENCES stylist_variants(id) ON DELETE CASCADE,
    marketplace VARCHAR(32) NOT NULL,
    external_product_id VARCHAR(128) NOT NULL,
    title VARCHAR(255) NOT NULL,
    brand VARCHAR(120),
    price_rub INT,
    image_url VARCHAR(512),
    product_url VARCHAR(512),
    sort_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stylist_products_variant_id ON stylist_products(variant_id);

INSERT INTO ai_prompt_templates (template_key, title, description, body)
SELECT
    'stylist.avatar_analysis_ru',
    'Стилист - анализ аватара',
    'Редактируемая текстовая часть для мягкого анализа аватара. Система дописывает событие, дату, антропометрию и технические ограничения.',
    'Ты профессиональный стилист. Проанализируй аватар бережно и честно: пропорции силуэта, общую геометрию лица, текущую прическу, цветовую температуру внешности и то, какие приемы в одежде будут работать лучше. Не используй унизительные оценки, диагнозы, медицинские термины и фразы про недостатки. Пиши через гармонию, баланс, посадку, вертикали, фактуры и акценты.'
WHERE NOT EXISTS (SELECT 1 FROM ai_prompt_templates WHERE template_key = 'stylist.avatar_analysis_ru');

INSERT INTO ai_prompt_templates (template_key, title, description, body)
SELECT
    'stylist.trends_ru',
    'Стилист - тренды и стиль',
    'Редактируемая текстовая часть для подбора трех направлений образа. Система дописывает пресет, дату, сезон, антропометрию и технические ограничения.',
    'Подбери индивидуальный образ под выбранное событие, текущий сезон и актуальные модные тенденции. Нужны три варианта: сдержанный классический, модный современный и вызывающий бунтарский. Для каждого варианта опиши одежду, обувь, аксессуары, прическу, цвет волос/укладку и макияж. Образ должен выглядеть реалистично, покупаемо на маркетплейсе и подходить человеку с аватара.'
WHERE NOT EXISTS (SELECT 1 FROM ai_prompt_templates WHERE template_key = 'stylist.trends_ru');

INSERT INTO ai_prompt_templates (template_key, title, description, body)
SELECT
    'stylist.preview_tryon_ru',
    'Стилист - примерка варианта образа',
    'Редактируемая текстовая часть для генерации визуального превью выбранного стилистического варианта. Система дописывает описание варианта и аватар.',
    'Создай фотореалистичную визуализацию полного образа на аватаре пользователя. Сохрани личность, лицо, волосы, тон кожи, возрастное впечатление, рост и пропорции тела. Замени одежду на описанный стилистом комплект, добавь уместные обувь и аксессуары. Результат: вертикальное фото 3:4, полный рост, аккуратный свет, без эротизации и без изменения фигуры.'
WHERE NOT EXISTS (SELECT 1 FROM ai_prompt_templates WHERE template_key = 'stylist.preview_tryon_ru');
