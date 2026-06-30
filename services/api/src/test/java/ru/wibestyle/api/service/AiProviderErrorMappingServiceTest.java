package ru.wibestyle.api.service;

import org.junit.jupiter.api.Test;
import ru.wibestyle.api.domain.AiProviderErrorMappingEntity;
import ru.wibestyle.api.repository.AiProviderErrorMappingRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AiProviderErrorMappingServiceTest {

    @Test
    void matchesConfiguredErrorAsCaseInsensitiveSubstring() {
        AiProviderErrorMappingRepository repository = mock(AiProviderErrorMappingRepository.class);
        AiProviderErrorMappingEntity mapping = new AiProviderErrorMappingEntity(
                UUID.randomUUID(),
                "Generated image rejected by content moderation.",
                "Примерка не списана с вашего баланса.",
                "VTON_CONTENT_MODERATION",
                true,
                Instant.now(),
                Instant.now()
        );
        when(repository.findByEnabledTrueOrderByCreatedAtAsc()).thenReturn(List.of(mapping));

        AiProviderErrorMappingService service = new AiProviderErrorMappingService(repository);

        var match = service.match(
                "Provider failed: GENERATED IMAGE REJECTED BY CONTENT MODERATION. request=42"
        );

        assertThat(match).isPresent();
        assertThat(match.orElseThrow().errorCode()).isEqualTo("VTON_CONTENT_MODERATION");
        assertThat(match.orElseThrow().userMessage()).contains("не списана");
    }
}
