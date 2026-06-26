package ru.wibestyle.api.service;

import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.nio.file.Files;

import static org.assertj.core.api.Assertions.assertThat;

class AvatarPrivacyImageProcessorTest {

    private final AvatarPrivacyImageProcessor processor = new AvatarPrivacyImageProcessor();

    @Test
    void blursFaceAndBackgroundWithoutChangingDimensions() throws Exception {
        BufferedImage original = new BufferedImage(240, 320, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = original.createGraphics();
        graphics.setColor(new Color(230, 240, 255));
        graphics.fillRect(0, 0, 240, 320);
        graphics.setColor(new Color(255, 80, 150));
        graphics.fillRect(0, 0, 50, 320);
        graphics.setColor(new Color(35, 35, 38));
        graphics.fillRect(85, 105, 70, 180);
        graphics.setColor(new Color(210, 150, 115));
        graphics.fillOval(92, 34, 56, 70);
        graphics.dispose();

        var source = Files.createTempFile("avatar-privacy-", ".jpg");
        try {
            ImageIO.write(original, "jpg", source.toFile());

            BufferedImage processed = processor.process(source, true, true);

            assertThat(processed.getWidth()).isEqualTo(original.getWidth());
            assertThat(processed.getHeight()).isEqualTo(original.getHeight());
            assertThat(processed.getRGB(120, 66)).isNotEqualTo(original.getRGB(120, 66));
            assertThat(processed.getRGB(8, 8)).isNotEqualTo(original.getRGB(8, 8));
        } finally {
            Files.deleteIfExists(source);
        }
    }
}
