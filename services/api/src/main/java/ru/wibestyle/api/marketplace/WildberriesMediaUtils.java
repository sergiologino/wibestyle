package ru.wibestyle.api.marketplace;

import java.util.Locale;
import org.springframework.http.MediaType;

public final class WildberriesMediaUtils {

    private WildberriesMediaUtils() {
    }

    public static boolean isVideoMediaUrl(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        String lower = url.toLowerCase(Locale.ROOT);
        if (lower.contains("/mp4/") || lower.contains("/video/")) {
            return true;
        }
        if (lower.contains("videonme-basket") || lower.contains("video.wbstatic")) {
            return true;
        }
        if (lower.contains("wbcontent.net") && lower.contains("mp4")) {
            return true;
        }
        return lower.endsWith(".mp4")
                || lower.endsWith(".webm")
                || lower.endsWith(".m3u8")
                || lower.endsWith(".mov");
    }

    public static boolean isVideoBytes(byte[] data) {
        if (data == null || data.length < 8) {
            return false;
        }
        if (data[4] == 'f' && data[5] == 't' && data[6] == 'y' && data[7] == 'p') {
            return true;
        }
        return (data[0] & 0xFF) == 0x1A
                && (data[1] & 0xFF) == 0x45
                && (data[2] & 0xFF) == 0xDF
                && (data[3] & 0xFF) == 0xA3;
    }

    public static boolean isImageBytes(byte[] data) {
        if (data == null || data.length < 12) {
            return false;
        }
        if ((data[0] & 0xFF) == 0xFF && (data[1] & 0xFF) == 0xD8) {
            return true;
        }
        if (data[0] == (byte) 0x89 && data[1] == 'P' && data[2] == 'N' && data[3] == 'G') {
            return true;
        }
        if (data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F'
                && data[8] == 'W' && data[9] == 'E' && data[10] == 'B' && data[11] == 'P') {
            return true;
        }
        return data[0] == 'G' && data[1] == 'I' && data[2] == 'F';
    }

    public static boolean isProductImageBytes(byte[] data) {
        return isImageBytes(data) && !isVideoBytes(data);
    }

    public static MediaType detectImageMediaType(byte[] image) {
        if (image == null || image.length < 12) {
            return MediaType.parseMediaType("image/webp");
        }
        if (image[0] == (byte) 0x89 && image[1] == 'P' && image[2] == 'N' && image[3] == 'G') {
            return MediaType.IMAGE_PNG;
        }
        if ((image[0] & 0xFF) == 0xFF && (image[1] & 0xFF) == 0xD8) {
            return MediaType.IMAGE_JPEG;
        }
        return MediaType.parseMediaType("image/webp");
    }
}
