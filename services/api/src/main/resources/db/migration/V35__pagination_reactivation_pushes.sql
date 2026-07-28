CREATE INDEX IF NOT EXISTS idx_try_on_sessions_user_status_created
    ON try_on_sessions(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gallery_posts_public_created
    ON gallery_posts(visibility, moderation_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_created_at_desc
    ON users(created_at DESC);

CREATE TABLE user_activity (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    last_seen_at TIMESTAMP NOT NULL,
    last_try_on_at TIMESTAMP,
    last_gallery_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_activity_last_seen ON user_activity(last_seen_at);
CREATE INDEX idx_user_activity_last_try_on ON user_activity(last_try_on_at);

CREATE TABLE reactivation_push_templates (
    id UUID PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    body VARCHAR(240) NOT NULL,
    action_url VARCHAR(512) NOT NULL DEFAULT '/try-on',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reactivation_push_templates_enabled
    ON reactivation_push_templates(enabled, sort_order);

CREATE TABLE reactivation_push_log (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES reactivation_push_templates(id),
    notification_id UUID REFERENCES user_notifications(id) ON DELETE SET NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action_url VARCHAR(512) NOT NULL,
    dedupe_key VARCHAR(200) NOT NULL,
    UNIQUE (user_id, template_id)
);

CREATE INDEX idx_reactivation_push_log_user_sent
    ON reactivation_push_log(user_id, sent_at DESC);

INSERT INTO reactivation_push_templates (id, title, body, action_url, sort_order) VALUES
('00000000-0000-0000-0000-000000035001', 'Время для новой примерки', 'Есть свободная минутка? Проверь, как на тебе сядет новый образ.', '/try-on', 1),
('00000000-0000-0000-0000-000000035002', 'Новый look рядом', 'Твой следующий удачный look может быть в одной примерке отсюда.', '/try-on', 2),
('00000000-0000-0000-0000-000000035003', 'Загляни в примерочную', 'Иногда вещь удивляет только после примерки.', '/try-on', 3),
('00000000-0000-0000-0000-000000035004', 'Проверь корзину', 'Попробуй примерить то, что давно лежит в корзине.', '/try-on/link', 4),
('00000000-0000-0000-0000-000000035005', 'Оцени на себе', 'Новый образ проще оценить на себе, чем по фото товара.', '/try-on', 5),
('00000000-0000-0000-0000-000000035006', 'Перед покупкой', 'Давай быстро проверим одну вещь перед покупкой.', '/try-on/link', 6),
('00000000-0000-0000-0000-000000035007', 'Обнови стиль', 'Хочется обновить стиль? Начни с одной виртуальной примерки.', '/try-on', 7),
('00000000-0000-0000-0000-000000035008', 'Сравни посадку', 'Посмотри, как другая посадка меняет весь образ.', '/try-on', 8),
('00000000-0000-0000-0000-000000035009', 'Меньше случайных покупок', 'Одна примерка может сэкономить одну неудачную покупку.', '/try-on', 9),
('00000000-0000-0000-0000-000000035010', 'Вернись на минуту', 'Выбери вещь, а мы покажем её на тебе.', '/try-on', 10),
('00000000-0000-0000-0000-000000035011', 'Есть идея образа?', 'Самое время примерить её на себе.', '/try-on/photo', 11),
('00000000-0000-0000-0000-000000035012', 'Пока не забыла', 'Проверь вещь на себе до заказа.', '/try-on/link', 12),
('00000000-0000-0000-0000-000000035013', 'Новая находка', 'Твой гардероб ждёт новую удачную находку.', '/try-on', 13),
('00000000-0000-0000-0000-000000035014', 'Попробуй смелее', 'Примерь образ, который обычно не решалась заказать.', '/try-on', 14),
('00000000-0000-0000-0000-000000035015', 'Быстрая проверка', 'Сделай быструю примерку и сравни, подходит ли вещь тебе.', '/try-on', 15);
