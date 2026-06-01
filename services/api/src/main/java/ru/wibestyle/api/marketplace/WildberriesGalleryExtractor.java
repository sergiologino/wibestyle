package ru.wibestyle.api.marketplace;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Extracts Wildberries gallery photos from product page HTML (swiper miniatures).
 * Skips {@code video-js} / {@code videonme-basket} mp4 slots; keeps {@code img} CDN urls in DOM order.
 */
final class WildberriesGalleryExtractor {

    private static final Pattern PHOTO_URL = Pattern.compile(
            "https://basket-(\\d+)\\.(?:wbbasket\\.ru|wbcontent\\.net)/vol\\d+/part\\d+/\\d+/images/[^\"'\\s<>]+\\.(?:webp|jpg|jpeg|png)",
            Pattern.CASE_INSENSITIVE);

    private WildberriesGalleryExtractor() {
    }

    static List<String> extractPhotoUrls(String html, long expectedArticle) {
        if (html == null || html.isBlank()) {
            return List.of();
        }
        LinkedHashSet<String> ordered = new LinkedHashSet<>();
        Matcher matcher = PHOTO_URL.matcher(html);
        while (matcher.find()) {
            String raw = matcher.group();
            if (WildberriesMediaUtils.isVideoMediaUrl(raw)) {
                continue;
            }
            String articleToken = "/" + expectedArticle + "/images/";
            if (!raw.contains(articleToken)) {
                continue;
            }
            ordered.add(WildberriesMediaRules.normalizePhotoUrl(raw));
        }
        return new ArrayList<>(ordered);
    }

    static String extractBasketHost(String photoUrl) {
        if (photoUrl == null || photoUrl.isBlank()) {
            return null;
        }
        Matcher matcher = Pattern.compile(
                "https://basket-(\\d+)\\.(?:wbbasket\\.ru|wbcontent\\.net)",
                Pattern.CASE_INSENSITIVE
        ).matcher(photoUrl);
        if (!matcher.find()) {
            return null;
        }
        int basket = Integer.parseInt(matcher.group(1));
        return WildberriesMediaRules.basketHost(basket);
    }
}
