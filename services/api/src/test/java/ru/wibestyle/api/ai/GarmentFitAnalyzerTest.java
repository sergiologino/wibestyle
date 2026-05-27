package ru.wibestyle.api.ai;

import org.junit.jupiter.api.Test;
import ru.wibestyle.api.domain.AvatarSnapshotEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.domain.TryOnSourceType;
import ru.wibestyle.api.marketplace.ProductSizeChart;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class GarmentFitAnalyzerTest {

    private final GarmentFitAnalyzer analyzer = new GarmentFitAnalyzer();

    @Test
    void detectsTooSmallGarmentForCurvyAvatar() {
        TryOnSessionEntity session = session("S", "[\"S\",\"M\",\"L\",\"XL\"]");
        AvatarSnapshotEntity snapshot = snapshot(168, 98, 76, 102, "50");

        GarmentFitAnalyzer.GarmentFitAssessment assessment = analyzer.analyze(session, snapshot, ProductSizeChart.empty());

        assertThat(assessment.status()).isEqualTo("too_small");
        assertThat(assessment.recommendedSize()).isIn("L", "XL");
        assertThat(assessment.fitPromptHint()).contains("do NOT slim");
    }

    @Test
    void okWhenSizesAlign() {
        TryOnSessionEntity session = session("L", "[\"S\",\"M\",\"L\"]");
        AvatarSnapshotEntity snapshot = snapshot(170, 92, 70, 96, "48");

        GarmentFitAnalyzer.GarmentFitAssessment assessment = analyzer.analyze(session, snapshot, ProductSizeChart.empty());

        assertThat(assessment.status()).isEqualTo("ok");
    }

    private static TryOnSessionEntity session(String selectedSize, String sizesJson) {
        TryOnSessionEntity session = new TryOnSessionEntity(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                TryOnSourceType.MARKETPLACE_LINK,
                TryOnSessionStatus.GENERATING,
                Instant.now(),
                Instant.now()
        );
        session.setSelectedSize(selectedSize);
        session.setProductSizes(sizesJson);
        return session;
    }

    private static AvatarSnapshotEntity snapshot(
            int height,
            int bust,
            int waist,
            int hips,
            String clothingSize
    ) {
        return new AvatarSnapshotEntity(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                height,
                bust,
                waist,
                hips,
                38,
                clothingSize,
                "/tmp/a.jpg",
                false,
                false,
                false,
                0.9,
                "v1",
                Instant.now()
        );
    }
}
