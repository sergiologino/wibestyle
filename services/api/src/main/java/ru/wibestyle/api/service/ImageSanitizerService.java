package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class ImageSanitizerService {

    public byte[] stripExif(InputStream inputStream, String contentType) throws IOException {
        if (contentType == null || !contentType.startsWith("image/")) {
            return inputStream.readAllBytes();
        }

        BufferedImage image = ImageIO.read(inputStream);
        if (image == null) {
            throw new IllegalArgumentException("INVALID_IMAGE_TYPE");
        }

        String format = switch (contentType) {
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> "jpg";
        };

        ByteArrayOutputStream output = new ByteArrayOutputStream();
        if (!ImageIO.write(image, format, output)) {
            ImageIO.write(image, "jpg", output);
        }
        return output.toByteArray();
    }

    public void stripExifInPlace(Path path, String contentType) throws IOException {
        if (contentType == null || !contentType.startsWith("image/")) {
            return;
        }
        try {
            byte[] sanitized = stripExif(Files.newInputStream(path), contentType);
            Files.write(path, sanitized);
        } catch (IllegalArgumentException ex) {
            if ("INVALID_IMAGE_TYPE".equals(ex.getMessage())) {
                return;
            }
            throw ex;
        }
    }
}
