package ru.wibestyle.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;
import ru.wibestyle.api.ai.NoteappAiClient;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.domain.AvatarStatus;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.List;

class AvatarValidationServiceTest {

    @Test
    void eachAvatarUsesItsOwnVisionValidationSubjectAndPhotoFingerprint() {
        UUID userId = UUID.fromString("5e48abdb-1238-4567-89ab-ef1234567890");
        UUID firstAvatar = UUID.fromString("11111111-2222-3333-4444-555555555555");
        UUID secondAvatar = UUID.fromString("66666666-7777-8888-9999-aaaaaaaaaaaa");

        assertThat(AvatarService.visionValidationSubject(userId, firstAvatar))
                .isNotEqualTo(AvatarService.visionValidationSubject(userId, secondAvatar));
        assertThat(AvatarQualityAnalyzer.sha256("first-image".getBytes()))
                .isNotEqualTo(AvatarQualityAnalyzer.sha256("second-image".getBytes()));
    }

    @Test
    void multiplePeopleGetsAnExplicitReasonBeforeTheRecommendation() {
        assertThat(AvatarQualityAnalyzer.buildRejectionTitle(List.of("MULTIPLE_PEOPLE")))
                .isEqualTo("Фото не добавлено: в кадре несколько человек.");
    }

    @Test
    void smallAvatarImageRequiresReplacement() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        AiIntegrationProperties aiProperties = new AiIntegrationProperties();
        AvatarQualityAnalyzer analyzer = new AvatarQualityAnalyzer(objectMapper, aiProperties, null, null);
        AvatarValidationService service = new AvatarValidationService(objectMapper, analyzer);

        Path imagePath = Files.createTempFile("avatar-small-", ".jpg");
        try {
            BufferedImage image = new BufferedImage(320, 480, BufferedImage.TYPE_INT_RGB);
            Graphics2D graphics = image.createGraphics();
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, image.getWidth(), image.getHeight());
            graphics.dispose();
            ImageIO.write(image, "jpg", imagePath.toFile());

            AvatarValidationService.ValidationOutcome outcome =
                    service.validate("test-avatar-user", "avatar.jpg", Files.size(imagePath), "image/jpeg", imagePath);

            assertThat(outcome.status()).isEqualTo(AvatarStatus.VALIDATION_FAILED);
            assertThat(outcome.recommendedAction()).isEqualTo("replace_photo");
            assertThat(outcome.warnings()).contains("LOW_RESOLUTION");
        } finally {
            Files.deleteIfExists(imagePath);
        }
    }

    @Test
    void aiUsableBusyBackgroundOverridesUnreadableLocalImageProbe() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        AiIntegrationProperties aiProperties = new AiIntegrationProperties();
        aiProperties.setEnabled(true);
        aiProperties.setApiKey("test-key");
        aiProperties.setSizeComplimentNetwork("openai-gpt4o-mini");
        AvatarQualityAnalyzer analyzer = new AvatarQualityAnalyzer(
                objectMapper,
                aiProperties,
                new FakeVisionClient("{\"quality\":\"usable\",\"warnings\":[\"BUSY_BACKGROUND\"],\"message\":\"Отличное фото, но фон немного загружен!\"}"),
                null
        );
        AvatarValidationService service = new AvatarValidationService(objectMapper, analyzer);

        Path imagePath = Files.createTempFile("avatar-webp-unreadable-", ".webp");
        try {
            byte[] bytes = new byte[25_000];
            bytes[0] = 'R';
            bytes[1] = 'I';
            bytes[2] = 'F';
            bytes[3] = 'F';
            bytes[8] = 'W';
            bytes[9] = 'E';
            bytes[10] = 'B';
            bytes[11] = 'P';
            Files.write(imagePath, bytes);

            AvatarValidationService.ValidationOutcome outcome =
                    service.validate("test-avatar-user", "avatar.webp", Files.size(imagePath), "image/webp", imagePath);

            assertThat(outcome.status()).isEqualTo(AvatarStatus.PHOTO_UPLOADED);
            assertThat(outcome.recommendedAction()).isEqualTo("continue_with_warning");
            assertThat(outcome.warnings()).containsExactly("BUSY_BACKGROUND");
            assertThat(outcome.guidanceTitle()).isEqualTo("Фото подойдёт для примерки");
        } finally {
            Files.deleteIfExists(imagePath);
        }
    }

    private static class FakeVisionClient extends NoteappAiClient {
        private final String response;

        FakeVisionClient(String response) {
            super(RestClient.builder(), new AiIntegrationProperties(), null, null);
            this.response = response;
        }

        @Override
        public String generateVisionChatText(
                String networkName,
                String externalUserId,
                String systemPrompt,
                String userText,
                String imageBase64,
                String mimeType
        ) {
            return response;
        }
    }
}
