package ru.wibestyle.api.ai;

import org.junit.jupiter.api.Test;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.domain.AvatarSnapshotEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.domain.TryOnSourceType;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class SizeComplimentServiceTest {

    @Test
    void buildsFallbackResultComplimentForTrialUser() {
        SizeComplimentService service = new SizeComplimentService(null, new AiIntegrationProperties(), null);
        TryOnSessionEntity session = session();
        GarmentFitAnalyzer.GarmentFitAssessment assessment =
                new GarmentFitAnalyzer.GarmentFitAssessment("ok", "M", null, 0, "", false);

        String compliment = service.buildResultCompliment(session, assessment, snapshot(), "trial");

        assertThat(compliment).isNotBlank();
        assertThat(compliment.length()).isLessThanOrEqualTo(500);
    }

    private static TryOnSessionEntity session() {
        TryOnSessionEntity session = new TryOnSessionEntity(
                UUID.fromString("00000000-0000-0000-0000-000000000123"),
                UUID.randomUUID(),
                UUID.randomUUID(),
                TryOnSourceType.MARKETPLACE_LINK,
                TryOnSessionStatus.READY,
                Instant.now(),
                Instant.now()
        );
        session.setProductTitle("Платье миди");
        session.setProductBrand("Wibe");
        session.setSelectedSize("M");
        return session;
    }

    private static AvatarSnapshotEntity snapshot() {
        return new AvatarSnapshotEntity(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                170,
                90,
                70,
                98,
                38,
                "M",
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
