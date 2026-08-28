package ru.wibestyle.api.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
}
