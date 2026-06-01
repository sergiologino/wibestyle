package ru.wibestyle.api.marketplace;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Wildberries media layout:
 * <ul>
 *   <li>Photos: {@code https://basket-NN.wbbasket.ru/vol{V}/part{P}/{nm}/images/{size}/{index}.webp}</li>
 *   <li>Video (separate CDN, not used for try-on): {@code https://videonme-basket-NN.wbcontent.net/.../mp4/.../*.mp4}</li>
 *   <li>Basket shard {@code NN} is NOT reliably derived from {@code vol}; resolve via {@code card.json}.</li>
 * </ul>
 */
@Component
public class WildberriesMediaRules implements MarketplaceMediaRules {

    public static final int MAX_PRODUCT_IMAGE_INDEX = 15;

    /** Primary garment photo size for AI try-on. */
    public static final String PRIMARY_IMAGE_SIZE = "big";

    /** Fallback sizes if {@code big/} is missing on a shard. */
    public static final String[] FALLBACK_IMAGE_SIZES = {"c516x688", "c246x328"};

    public static final String CARD_JSON_PATH = "/info/ru/card.json";

    public static final String BASKET_HOST_TEMPLATE = "https://basket-%02d.wbbasket.ru";

    public static final String WBCONTENT_HOST_SUFFIX = "wbcontent.net";

    public static final String WBBASKET_HOST_SUFFIX = "wbbasket.ru";

    public static String basketHost(int basketNumber) {
        return BASKET_HOST_TEMPLATE.formatted(Math.max(1, Math.min(basketNumber, 40)));
    }

    /** Prefer {@code big/} for try-on; page thumbnails often use {@code c246x328/}. */
    public static String normalizePhotoUrl(String url) {
        if (url == null || url.isBlank()) {
            return url;
        }
        String normalized = url.replaceAll("/images/c\\d+x\\d+/", "/images/" + PRIMARY_IMAGE_SIZE + "/");
        normalized = normalized.replace("/images/tm/", "/images/" + PRIMARY_IMAGE_SIZE + "/");
        return normalized.replace(WBCONTENT_HOST_SUFFIX, WBBASKET_HOST_SUFFIX);
    }

    public static String mirrorToWbContent(String wbbasketUrl) {
        if (wbbasketUrl == null) {
            return null;
        }
        return wbbasketUrl.replace(WBBASKET_HOST_SUFFIX, WBCONTENT_HOST_SUFFIX);
    }

    public List<String> photoDownloadCandidates(long article, String host, int photoCount) {
        List<String> candidates = new ArrayList<>();
        int lastIndex = Math.max(1, Math.min(photoCount > 0 ? photoCount : MAX_PRODUCT_IMAGE_INDEX, MAX_PRODUCT_IMAGE_INDEX));
        for (int index = 1; index <= lastIndex; index++) {
            addSizeCandidates(candidates, buildImageUrl(article, host, PRIMARY_IMAGE_SIZE, index));
            for (String sizeFolder : FALLBACK_IMAGE_SIZES) {
                addSizeCandidates(candidates, buildImageUrl(article, host, sizeFolder, index));
            }
        }
        return candidates;
    }

    private static void addSizeCandidates(List<String> candidates, String wbbasketUrl) {
        if (wbbasketUrl == null || candidates.contains(wbbasketUrl)) {
            return;
        }
        candidates.add(wbbasketUrl);
        String mirror = mirrorToWbContent(wbbasketUrl);
        if (mirror != null && !candidates.contains(mirror)) {
            candidates.add(mirror);
        }
    }

    @Override
    public String marketplaceId() {
        return "wildberries";
    }

    @Override
    public boolean isVideoMediaUrl(String url) {
        return WildberriesMediaUtils.isVideoMediaUrl(url);
    }

    @Override
    public boolean isProductImageBytes(byte[] data) {
        return WildberriesMediaUtils.isProductImageBytes(data);
    }

    public String buildImageUrl(long article, String host, int imageIndex) {
        return buildImageUrl(article, host, PRIMARY_IMAGE_SIZE, imageIndex);
    }

    public String buildImageUrl(long article, String host, String sizeFolder, int imageIndex) {
        long vol = article / 100_000;
        long part = article / 1_000;
        int idx = Math.max(1, Math.min(imageIndex, MAX_PRODUCT_IMAGE_INDEX));
        return host + "/vol" + vol + "/part" + part + "/" + article + "/images/" + sizeFolder + "/" + idx + ".webp";
    }

    public String buildCardJsonUrl(long article, String host) {
        long vol = article / 100_000;
        long part = article / 1_000;
        return host + "/vol" + vol + "/part" + part + "/" + article + CARD_JSON_PATH;
    }
}
