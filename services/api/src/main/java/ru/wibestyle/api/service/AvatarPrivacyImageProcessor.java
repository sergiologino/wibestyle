package ru.wibestyle.api.service;

import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Path;

@Component
public class AvatarPrivacyImageProcessor {

    public BufferedImage process(Path originalPath, boolean hideFace, boolean hideBackground) throws IOException {
        BufferedImage original = ImageIO.read(originalPath.toFile());
        if (original == null) {
            throw new IOException("AVATAR_IMAGE_READ_FAILED");
        }
        BufferedImage normalized = normalize(original);
        BufferedImage blurred = boxBlur(normalized, 14);
        BufferedImage result = hideBackground ? blurBackground(normalized, blurred) : copy(normalized);
        if (hideFace) {
            blurFace(result, blurred);
        }
        return result;
    }

    public void writeJpeg(BufferedImage image, Path target) throws IOException {
        if (!ImageIO.write(image, "jpg", target.toFile())) {
            throw new IOException("AVATAR_IMAGE_WRITE_FAILED");
        }
    }

    private static BufferedImage normalize(BufferedImage source) {
        BufferedImage normalized = new BufferedImage(source.getWidth(), source.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = normalized.createGraphics();
        graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        graphics.drawImage(source, 0, 0, null);
        graphics.dispose();
        return normalized;
    }

    private static BufferedImage copy(BufferedImage source) {
        BufferedImage copy = new BufferedImage(source.getWidth(), source.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = copy.createGraphics();
        graphics.drawImage(source, 0, 0, null);
        graphics.dispose();
        return copy;
    }

    private static BufferedImage blurBackground(BufferedImage original, BufferedImage blurred) {
        int width = original.getWidth();
        int height = original.getHeight();
        BufferedImage result = copy(blurred);
        double centerX = width / 2.0;
        double centerY = height * 0.52;
        double radiusX = width * 0.34;
        double radiusY = height * 0.50;

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                double dx = (x - centerX) / radiusX;
                double dy = (y - centerY) / radiusY;
                if (dx * dx + dy * dy <= 1.0) {
                    result.setRGB(x, y, original.getRGB(x, y));
                }
            }
        }
        return result;
    }

    private static void blurFace(BufferedImage target, BufferedImage blurred) {
        FaceBox face = detectFace(target);
        double centerX = face.x + face.width / 2.0;
        double centerY = face.y + face.height / 2.0;
        double radiusX = Math.max(1, face.width / 2.0);
        double radiusY = Math.max(1, face.height / 2.0);

        int minX = Math.max(0, face.x);
        int minY = Math.max(0, face.y);
        int maxX = Math.min(target.getWidth(), face.x + face.width);
        int maxY = Math.min(target.getHeight(), face.y + face.height);

        for (int y = minY; y < maxY; y++) {
            for (int x = minX; x < maxX; x++) {
                double dx = (x - centerX) / radiusX;
                double dy = (y - centerY) / radiusY;
                if (dx * dx + dy * dy <= 1.0) {
                    target.setRGB(x, y, blurred.getRGB(x, y));
                }
            }
        }
    }

    private static FaceBox detectFace(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();
        int minX = width;
        int minY = height;
        int maxX = 0;
        int maxY = 0;
        int count = 0;

        int startX = (int) (width * 0.18);
        int endX = (int) (width * 0.82);
        int startY = (int) (height * 0.04);
        int endY = (int) (height * 0.38);

        for (int y = startY; y < endY; y += 2) {
            for (int x = startX; x < endX; x += 2) {
                int rgb = image.getRGB(x, y);
                int r = (rgb >> 16) & 0xff;
                int g = (rgb >> 8) & 0xff;
                int b = rgb & 0xff;
                if (isSkinLike(r, g, b)) {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                    count++;
                }
            }
        }

        if (count < 24 || maxX <= minX || maxY <= minY) {
            int fallbackWidth = (int) (width * 0.28);
            int fallbackHeight = (int) (height * 0.16);
            return new FaceBox((width - fallbackWidth) / 2, (int) (height * 0.08), fallbackWidth, fallbackHeight);
        }

        int detectedWidth = maxX - minX + 1;
        int detectedHeight = maxY - minY + 1;
        int padX = Math.max(18, (int) (detectedWidth * 0.55));
        int padY = Math.max(24, (int) (detectedHeight * 0.65));
        int x = Math.max(0, minX - padX);
        int y = Math.max(0, minY - padY / 2);
        int faceWidth = Math.min(width - x, detectedWidth + padX * 2);
        int faceHeight = Math.min(height - y, detectedHeight + padY);
        return new FaceBox(x, y, faceWidth, faceHeight);
    }

    private static boolean isSkinLike(int r, int g, int b) {
        int max = Math.max(r, Math.max(g, b));
        int min = Math.min(r, Math.min(g, b));
        return r > 70
                && g > 40
                && b > 25
                && max - min > 12
                && r > g
                && r > b
                && Math.abs(r - g) > 8;
    }

    private static BufferedImage boxBlur(BufferedImage source, int radius) {
        int width = source.getWidth();
        int height = source.getHeight();
        int smallWidth = Math.max(12, width / Math.max(6, radius));
        int smallHeight = Math.max(12, height / Math.max(6, radius));
        BufferedImage small = new BufferedImage(smallWidth, smallHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D down = small.createGraphics();
        down.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        down.drawImage(source, 0, 0, smallWidth, smallHeight, null);
        down.dispose();

        BufferedImage target = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D up = target.createGraphics();
        up.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        up.drawImage(small, 0, 0, width, height, null);
        up.dispose();
        return target;
    }

    private record FaceBox(int x, int y, int width, int height) {
    }
}
