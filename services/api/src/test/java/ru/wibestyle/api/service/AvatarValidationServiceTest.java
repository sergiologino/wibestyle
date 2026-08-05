package ru.wibestyle.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
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
        AvatarQualityAnalyzer analyzer = new AvatarQualityAnalyzer(objectMapper, aiProperties, null);
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
            assertThat(outcome.warnings()).contains("LOW_DETAIL");
            assertThat(outcome.guidanceMessage()).contains("чёткое фото");
        } finally {
            Files.deleteIfExists(imagePath);
        }
    }
}
