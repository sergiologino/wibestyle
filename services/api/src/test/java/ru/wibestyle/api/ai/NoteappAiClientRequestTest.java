package ru.wibestyle.api.ai;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
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
}
