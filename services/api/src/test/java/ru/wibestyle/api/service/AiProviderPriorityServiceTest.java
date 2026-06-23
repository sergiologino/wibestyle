package ru.wibestyle.api.service;

import org.junit.jupiter.api.Test;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.domain.AiOperations;
import ru.wibestyle.api.domain.AiProviderPriorityEntity;
import ru.wibestyle.api.repository.AiProviderPriorityRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AiProviderPriorityServiceTest {

    private final AiProviderPriorityRepository repository = mock(AiProviderPriorityRepository.class);
    private final AiIntegrationProperties properties = new AiIntegrationProperties();
    private final AiProviderPriorityService service = new AiProviderPriorityService(repository, properties);

    @Test
    void routeForUsesEnabledProvidersInPriorityOrder() {
        when(repository.findByOperationOrderByPriorityOrderAsc(AiOperations.VIRTUAL_TRY_ON_PHOTO))
                .thenReturn(List.of(
                        entity("fashn-try-on-photo", "FASHN", 20, true),
                        entity("kling-try-on-photo", "Kling", 30, true)
                ));
        when(repository.findByOperationAndEnabledTrueOrderByPriorityOrderAsc(AiOperations.VIRTUAL_TRY_ON_PHOTO))
                .thenReturn(List.of(
                        entity("kling-try-on-photo", "Kling", 30, true),
                        entity("fashn-try-on-photo", "FASHN", 20, true)
                ));

        List<AiProviderPriorityService.ProviderRoute> route =
                service.routeFor(AiOperations.VIRTUAL_TRY_ON_PHOTO);

        assertThat(route).extracting(AiProviderPriorityService.ProviderRoute::networkName)
                .containsExactly("fashn-try-on-photo", "kling-try-on-photo");
    }

    @Test
    void routeForFallsBackToConfiguredNetworkWhenDatabaseRouteIsEmpty() {
        properties.setVirtualTryOnNetwork("custom-primary");
        when(repository.findByOperationOrderByPriorityOrderAsc(AiOperations.VIRTUAL_TRY_ON_PHOTO))
                .thenReturn(List.of());
        when(repository.findByOperationAndEnabledTrueOrderByPriorityOrderAsc(AiOperations.VIRTUAL_TRY_ON_PHOTO))
                .thenReturn(List.of());

        List<AiProviderPriorityService.ProviderRoute> route =
                service.routeFor(AiOperations.VIRTUAL_TRY_ON_PHOTO);

        assertThat(route).hasSize(1);
        assertThat(route.get(0).networkName()).isEqualTo("custom-primary");
    }

    @Test
    void routeForKeepsOperationDisabledWhenAllPersistedProvidersAreDisabled() {
        properties.setVirtualTryOnNetwork("legacy-env-network");
        when(repository.findByOperationOrderByPriorityOrderAsc(AiOperations.VIRTUAL_TRY_ON_PHOTO))
                .thenReturn(List.of(entity("wibestyle-vton", "Grok Imagine", 10, false)));
        when(repository.findByOperationAndEnabledTrueOrderByPriorityOrderAsc(AiOperations.VIRTUAL_TRY_ON_PHOTO))
                .thenReturn(List.of());

        assertThat(service.routeFor(AiOperations.VIRTUAL_TRY_ON_PHOTO)).isEmpty();
    }

    @Test
    void shouldFallbackForProviderModerationQuotaAndTimeoutFailures() {
        assertThat(service.shouldFallback("VTON_CONTENT_MODERATION")).isTrue();
        assertThat(service.shouldFallback("AI_PROVIDER_TOKENS_EXHAUSTED")).isTrue();
        assertThat(service.shouldFallback("AI_PROVIDER_TIMEOUT")).isTrue();
        assertThat(service.shouldFallback("EMPTY_RESPONSE")).isTrue();
        assertThat(service.shouldFallback("SESSION_NOT_FOUND")).isFalse();
    }

    private static AiProviderPriorityEntity entity(String network, String label, int priority, boolean enabled) {
        return new AiProviderPriorityEntity(
                UUID.randomUUID(),
                AiOperations.VIRTUAL_TRY_ON_PHOTO,
                network,
                label,
                priority,
                enabled,
                Instant.now()
        );
    }
}
