package ru.wibestyle.api.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.domain.TryOnSourceType;
import ru.wibestyle.api.service.AiIntegrationLogService;
import ru.wibestyle.api.service.AiProviderErrorMappingService;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class NoteappAiClientRequestTest {

    @Test
    void chatRequestsAlwaysContainTheExternalUserIdRequiredByNoteapp() {
        Map<String, Object> body = NoteappAiClient.buildChatRequestBody(
                "gpt-4o-mini",
                " avatar-user-42 ",
                Map.of("messages", java.util.List.of())
        );

        assertThat(body).containsEntry("userId", "avatar-user-42");
        assertThat(body).containsEntry("networkName", "gpt-4o-mini");
        assertThat(body).containsEntry("requestType", "chat");
    }

    @Test
    void chatRequestsRejectAMissingExternalUserIdBeforeSendingTheRequest() {
        assertThatThrownBy(() -> NoteappAiClient.buildChatRequestBody("gpt-4o-mini", " ", Map.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("NOTEAPP_EXTERNAL_USER_ID_REQUIRED");
    }

    @Test
    void stylistPreviewRejectsPollinationsFallbackResults() throws Exception {
        var response = new ObjectMapper().readTree("""
                {
                  "provider": "virtual_try_on_pollinations",
                  "tryOnRoute": "pollinations",
                  "tryOnRouteReason": "no_xai_api_key",
                  "data": [{"url": "https://image.pollinations.ai/prompt/test"}]
                }
                """);

        assertThat(NoteappAiClient.isPollinationsResult(
                response.path("provider").asText(null),
                "https://image.pollinations.ai/prompt/test",
                response
        )).isTrue();
    }

    @Test
    void sanitizerRedactsDisabledFallbackUrlsFromLogs() {
        Map<String, Object> sanitized = AiPayloadSanitizer.sanitize(Map.of(
                "provider", "virtual_try_on_pollinations",
                "data", java.util.List.of(Map.of("url", "https://image.pollinations.ai/prompt/test"))
        ));

        assertThat(sanitized.get("provider")).isEqualTo("[blocked disabled image fallback]");
        Object data = sanitized.get("data");
        assertThat(data).isInstanceOf(java.util.List.class);
        Map<?, ?> first = (Map<?, ?>) ((java.util.List<?>) data).get(0);
        assertThat(first.get("url")).isEqualTo("[blocked disabled image fallback]");
    }

    @Test
    void virtualTryOnRejectsPollinationsSuccessResponses() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        AiIntegrationProperties properties = new AiIntegrationProperties();
        properties.setBaseUrl("https://noteapp.test");
        properties.setApiKey("test-key");
        AiProviderErrorMappingService errorMapping = mock(AiProviderErrorMappingService.class);
        when(errorMapping.match(any())).thenReturn(java.util.Optional.empty());
        NoteappAiClient client = new NoteappAiClient(
                builder,
                properties,
                mock(AiIntegrationLogService.class),
                errorMapping
        );
        TryOnSessionEntity session = new TryOnSessionEntity(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                TryOnSourceType.MARKETPLACE_LINK,
                TryOnSessionStatus.GENERATING,
                java.time.Instant.now(),
                java.time.Instant.now()
        );
        server.expect(requestTo("https://noteapp.test/api/ai/process"))
                .andRespond(withSuccess("""
                        {
                          "status": "success",
                          "requestId": "req-1",
                          "networkUsed": "wibestyle-vton",
                          "response": {
                            "provider": "virtual_try_on_pollinations",
                            "tryOnRoute": "pollinations",
                            "data": [{"url": "https://image.pollinations.ai/prompt/fox"}]
                          }
                        }
                        """, MediaType.APPLICATION_JSON));

        NoteappAiClient.ProcessResult result = client.processVirtualTryOn(
                "wibestyle-vton",
                1,
                null,
                session,
                "prompt",
                "person-base64",
                "garment-base64",
                Map.of("operation", "virtual_try_on_photo"),
                null,
                null,
                null
        );

        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("AI_PROVIDER_FALLBACK_NOT_ALLOWED");
        assertThat(result.errorMessage()).contains("запрещённый fallback");
        server.verify();
    }

    @Test
    void virtualTryOnRejectsPollinationsNetworkBeforeSendingTheRequest() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        AiIntegrationProperties properties = new AiIntegrationProperties();
        properties.setBaseUrl("https://noteapp.test");
        properties.setApiKey("test-key");
        AiProviderErrorMappingService errorMapping = mock(AiProviderErrorMappingService.class);
        when(errorMapping.match(any())).thenReturn(java.util.Optional.empty());
        NoteappAiClient client = new NoteappAiClient(
                builder,
                properties,
                mock(AiIntegrationLogService.class),
                errorMapping
        );
        TryOnSessionEntity session = new TryOnSessionEntity(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                TryOnSourceType.MARKETPLACE_LINK,
                TryOnSessionStatus.GENERATING,
                java.time.Instant.now(),
                java.time.Instant.now()
        );

        NoteappAiClient.ProcessResult result = client.processVirtualTryOn(
                "virtual_try_on_pollinations",
                1,
                null,
                session,
                "prompt",
                "person-base64",
                "garment-base64",
                Map.of("operation", "virtual_try_on_photo"),
                null,
                null,
                null
        );

        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("AI_PROVIDER_FALLBACK_NOT_ALLOWED");
        server.verify();
    }

    @Test
    void hairstyleRejectsPollinationsNetworkBeforeSendingTheRequest() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        AiIntegrationProperties properties = new AiIntegrationProperties();
        properties.setBaseUrl("https://noteapp.test");
        properties.setApiKey("test-key");
        AiProviderErrorMappingService errorMapping = mock(AiProviderErrorMappingService.class);
        when(errorMapping.match(any())).thenReturn(java.util.Optional.empty());
        NoteappAiClient client = new NoteappAiClient(
                builder,
                properties,
                mock(AiIntegrationLogService.class),
                errorMapping
        );

        assertThatThrownBy(() -> client.applyHairstyle(
                "virtual_try_on_pollinations",
                "user-1",
                "portrait-base64",
                "style-base64",
                null,
                "prompt"
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("HAIRSTYLE_GENERATION_FAILED")
                .hasCauseInstanceOf(RestClientException.class);
        server.verify();
    }

    @Test
    void stylistPreviewPayloadSendsAvatarAndPortraitAsTwoRouteImages() {
        Map<String, Object> payload = NoteappAiClient.buildStylistPreviewPayload("prompt", "avatar-base64", "portrait-base64");

        assertThat(payload).containsEntry("personImageBase64", "avatar-base64");
        assertThat(payload).containsEntry("image1Base64", "avatar-base64");
        assertThat(payload).containsEntry("garmentImageBase64", "portrait-base64");
        assertThat(payload).containsEntry("productImageBase64", "portrait-base64");
        assertThat(payload).containsEntry("image2Base64", "portrait-base64");
        assertThat(payload.get("image2Role")).asString().contains("hairstyle reference");
    }
}
