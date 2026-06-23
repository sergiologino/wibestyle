package ru.wibestyle.api.ai;

import org.junit.jupiter.api.Test;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.domain.TryOnSourceType;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class NoteappAiClientTest {

    @Test
    void virtualTryOnPayloadLabelsImage1AndImage2Explicitly() {
        TryOnSessionEntity session = new TryOnSessionEntity(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                TryOnSourceType.MARKETPLACE_LINK,
                TryOnSessionStatus.GENERATING,
                Instant.now(),
                Instant.now()
        );
        session.setProductTitle("Dress");
        session.setGarmentCategory("dress");
        session.setGarmentPromptProfile("dress");
        session.setGarmentHasHumanModel(true);

        Map<String, Object> payload = NoteappAiClient.buildVirtualTryOnPayload(
                session,
                "prompt",
                "person-base64",
                "garment-base64",
                null,
                null,
                null
        );

        assertThat(payload).containsEntry("personImageBase64", "person-base64");
        assertThat(payload).containsEntry("garmentImageBase64", "garment-base64");
        assertThat(payload).containsEntry("image1Base64", "person-base64");
        assertThat(payload).containsEntry("image2Base64", "garment-base64");
        assertThat(payload.get("inputImageOrder").toString()).contains("image1/customer/avatar/personImageBase64");
        assertThat(payload.get("image1Role").toString()).contains("identity");
        assertThat(payload.get("image2Role").toString()).contains("ignore_any_person");

        Object images = payload.get("images");
        assertThat(images).isInstanceOf(List.class);
        List<?> list = (List<?>) images;
        assertThat(list).hasSize(2);
        Map<?, ?> image1 = (Map<?, ?>) list.get(0);
        Map<?, ?> image2 = (Map<?, ?>) list.get(1);
        assertThat(image1.get("label")).isEqualTo("image1");
        assertThat(image1.get("base64")).isEqualTo("person-base64");
        assertThat(image2.get("label")).isEqualTo("image2");
        assertThat(image2.get("base64")).isEqualTo("garment-base64");
    }
}
