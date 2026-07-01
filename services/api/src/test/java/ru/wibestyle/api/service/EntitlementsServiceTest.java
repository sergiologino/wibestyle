package ru.wibestyle.api.service;

import org.junit.jupiter.api.Test;
import ru.wibestyle.api.config.FeatureFlagsProperties;
import ru.wibestyle.api.domain.UserProfileEntity;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class EntitlementsServiceTest {

    @Test
    void trialGetsVideoEntitlementWhileFreeVideoRemains() {
        FeatureFlagsProperties flags = new FeatureFlagsProperties();
        flags.setFlags(Map.of("videoTryOn", true));
        EntitlementsService service = new EntitlementsService(flags);
        UserProfileEntity profile = new UserProfileEntity(UUID.randomUUID(), Instant.now());
        profile.setPlan("trial");
        profile.setTrialVideoGenerationsLeft(1);

        assertThat(service.forProfile(profile))
                .containsEntry("videoTryOn", true)
                .containsEntry("trialVideoGenerationsLeft", 1);

        profile.setTrialVideoGenerationsLeft(0);

        assertThat(service.forProfile(profile))
                .containsEntry("videoTryOn", false)
                .containsEntry("trialVideoGenerationsLeft", 0);
    }
}
