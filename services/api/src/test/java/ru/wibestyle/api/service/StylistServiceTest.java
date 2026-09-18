package ru.wibestyle.api.service;

import org.junit.jupiter.api.Test;
import ru.wibestyle.api.domain.StylistSessionEntity;
import ru.wibestyle.api.domain.StylistVariantEntity;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class StylistServiceTest {

    @Test
    void productSearchQueryFitsDatabaseColumn() {
        Instant now = Instant.now();
        StylistSessionEntity session = new StylistSessionEntity(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                "date",
                "Свидание",
                "осень",
                "",
                "",
                "generating",
                now,
                now
        );
        StylistVariantEntity variant = new StylistVariantEntity(
                UUID.randomUUID(),
                session.getId(),
                "modern",
                "Модный современный: мягкая городская романтика",
                "Для свидания",
                "Формула комплекта: асимметричный топ, широкие брюки, лакированные slingback, крупная серьга. Палитра: butter yellow с серым. Фактуры и акценты: актуальные пропорции, выразительная фактура, один свежий fashion-week акцент. Сезонная адаптация: структурный слой, кожа/замша/трикотаж, теплые глубокие оттенки. Обязательное отличие: использовать современную пропорцию или layering, а не тот же классический комплект. Не повторять универсальные шаблоны.",
                "Комментарий",
                "queued",
                1,
                now,
                now
        );

        assertThat(StylistService.productSearchQuery(session, variant)).hasSizeLessThanOrEqualTo(500);
    }
}
