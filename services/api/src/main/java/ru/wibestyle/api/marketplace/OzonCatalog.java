package ru.wibestyle.api.marketplace;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class OzonCatalog {

    private static final String OZON_USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
    private static final Pattern PRODUCT_SLUG = Pattern.compile("/product/([^/?#]+)");
    private static final Pattern TRAILING_SKU = Pattern.compile("-([0-9]{5,})$");
    private static final Pattern CONTEXT_ID = Pattern.compile("/context/detail/id/(\\d+)");
    private static final Pattern HTML_GALLERY_STATE =
            Pattern.compile("id=\"state-webGallery-[^\"]+\"[^>]*data-state=\"([^\"]+)\"");
    private static final Pattern HTML_IMAGE_URL =
            Pattern.compile("(https?:)?//(?:ir\\.ozone\\.ru|cdn\\d*\\.ozone\\.ru|st\\.ozone\\.ru)[^\"'\\s<>]+");

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public OzonCatalog(RestClient.Builder restClientBuilder, ObjectMapper objectMapper) {
        this.restClient = restClientBuilder
                .defaultHeader("User-Agent", OZON_USER_AGENT)
                .defaultHeader("Accept-Language", "ru-RU,ru;q=0.9")
                .build();
        this.objectMapper = objectMapper;
    }

    public Optional<OzonProductCard> fetchProductCard(String productSlug, String originalUrl) {
        String slug = normalizeSlug(productSlug, originalUrl);
        if (slug == null || slug.isBlank()) {
            return Optional.empty();
        }

        Optional<OzonProductCard> fromComposer = fetchComposerPage(slug, originalUrl);
        if (fromComposer.isPresent()) {
            return fromComposer;
        }

        String pageUrl = originalUrl == null || originalUrl.isBlank()
                ? defaultProductPageUrl(slug)
                : originalUrl;
        return fetchHtmlPage(pageUrl, slug);
    }

    public byte[] downloadImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return null;
        }
        String normalized = normalizeImageUrl(imageUrl);
        try {
            byte[] body = restClient.get()
                    .uri(URI.create(normalized))
                    .header("Accept", "image/avif,image/webp,image/apng,image/*,*/*;q=0.8")
                    .header("Referer", "https://www.ozon.ru/")
                    .retrieve()
                    .body(byte[].class);
            if (body != null && body.length > 0) {
                return body;
            }
        } catch (RestClientException ignored) {
            // fall through
        }
        return null;
    }

    public byte[] downloadProductImage(String productId, String originalUrl) {
        Optional<OzonProductCard> card = fetchProductCard(productId, originalUrl);
        if (card.isEmpty()) {
            return null;
        }
        byte[] image = downloadImage(card.get().imageUrl());
        if (image != null && image.length > 0) {
            return image;
        }
        return null;
    }

    public static MediaType detectImageMediaType(byte[] image) {
        if (image == null || image.length < 12) {
            return MediaType.IMAGE_JPEG;
        }
        if (image[0] == (byte) 'R' && image[1] == (byte) 'I' && image[2] == (byte) 'F' && image[3] == (byte) 'F') {
            return MediaType.parseMediaType("image/webp");
        }
        if (image[0] == (byte) 0x89 && image[1] == (byte) 'P' && image[2] == (byte) 'N' && image[3] == (byte) 'G') {
            return MediaType.IMAGE_PNG;
        }
        return MediaType.IMAGE_JPEG;
    }

    static String extractSlug(String urlOrSlug) {
        if (urlOrSlug == null || urlOrSlug.isBlank()) {
            return null;
        }
        Matcher contextMatcher = CONTEXT_ID.matcher(urlOrSlug);
        if (contextMatcher.find()) {
            return contextMatcher.group(1);
        }
        Matcher slugMatcher = PRODUCT_SLUG.matcher(urlOrSlug);
        if (slugMatcher.find()) {
            return slugMatcher.group(1);
        }
        return urlOrSlug.contains("/") ? null : urlOrSlug.trim();
    }

    static String extractNumericSku(String slug) {
        if (slug == null || slug.isBlank()) {
            return null;
        }
        if (slug.chars().allMatch(Character::isDigit)) {
            return slug;
        }
        Matcher trailing = TRAILING_SKU.matcher(slug);
        if (trailing.find()) {
            return trailing.group(1);
        }
        return null;
    }

    static Optional<OzonProductCard> parseComposerPage(JsonNode root, String slug, String originalUrl) {
        if (root == null || root.isMissingNode()) {
            return Optional.empty();
        }

        Builder builder = new Builder(slug, originalUrl);
        JsonNode widgetStates = root.path("widgetStates");
        if (widgetStates.isObject()) {
            widgetStates.fields().forEachRemaining(entry -> mergeWidget(builder, entry.getKey(), entry.getValue()));
        }
        mergeSeo(builder, root.path("seo"));
        return builder.build();
    }

    static Optional<OzonProductCard> parseHtmlPage(String html, String slug, String originalUrl) {
        if (html == null || html.isBlank()) {
            return Optional.empty();
        }

        Builder builder = new Builder(slug, originalUrl);
        Matcher galleryMatcher = HTML_GALLERY_STATE.matcher(html);
        if (galleryMatcher.find()) {
            String rawState = unescapeHtmlAttribute(galleryMatcher.group(1));
            try {
                JsonNode gallery = new ObjectMapper().readTree(rawState);
                mergeGallery(builder, gallery);
            } catch (JsonProcessingException ignored) {
                // try regex fallback below
            }
        }

        if (builder.imageUrl == null) {
            Matcher imageMatcher = HTML_IMAGE_URL.matcher(html);
            if (imageMatcher.find()) {
                builder.imageUrl = normalizeImageUrl(imageMatcher.group());
            }
        }

        int ldJsonStart = html.indexOf("application/ld+json");
        if (ldJsonStart >= 0) {
            int open = html.indexOf('>', ldJsonStart);
            int close = html.indexOf("</script>", open);
            if (open > 0 && close > open) {
                try {
                    JsonNode ld = new ObjectMapper().readTree(html.substring(open + 1, close).trim());
                    mergeJsonLd(builder, ld);
                } catch (JsonProcessingException ignored) {
                    // ignore malformed JSON-LD
                }
            }
        }

        return builder.build();
    }

    static String normalizeImageUrl(String url) {
        if (url == null || url.isBlank()) {
            return url;
        }
        String trimmed = url.trim();
        if (trimmed.startsWith("//")) {
            return "https:" + trimmed;
        }
        if (trimmed.startsWith("/")) {
            return "https://www.ozon.ru" + trimmed;
        }
        return trimmed;
    }

    private Optional<OzonProductCard> fetchComposerPage(String slug, String originalUrl) {
        List<String> productPaths = new ArrayList<>();
        productPaths.add("/product/" + slug + "/");
        if (slug.chars().allMatch(Character::isDigit)) {
            productPaths.add("/context/detail/id/" + slug + "/");
        }

        List<String> endpoints = new ArrayList<>();
        for (String productPath : productPaths) {
            endpoints.add("https://www.ozon.ru/api/composer-api.bx/page/json/v2?url="
                    + URLEncoder.encode(productPath, StandardCharsets.UTF_8));
            endpoints.add("https://www.ozon.ru/api/entrypoint-api.bx/page/json/v2?url="
                    + URLEncoder.encode(productPath, StandardCharsets.UTF_8));
        }

        for (String endpoint : endpoints) {
            try {
                JsonNode response = restClient.get()
                        .uri(endpoint)
                        .header("Accept", "application/json")
                        .header("Referer", "https://www.ozon.ru/")
                        .retrieve()
                        .body(JsonNode.class);
                Optional<OzonProductCard> parsed = parseComposerPage(response, slug, originalUrl);
                if (parsed.isPresent()) {
                    return parsed;
                }
            } catch (RestClientException ignored) {
                // try next endpoint
            }
        }
        return Optional.empty();
    }

    private Optional<OzonProductCard> fetchHtmlPage(String pageUrl, String slug) {
        try {
            String html = restClient.get()
                    .uri(pageUrl)
                    .header("Accept", "text/html,application/xhtml+xml")
                    .header("Referer", "https://www.ozon.ru/")
                    .retrieve()
                    .body(String.class);
            return parseHtmlPage(html, slug, pageUrl);
        } catch (RestClientException ex) {
            return Optional.empty();
        }
    }

    private static String defaultProductPageUrl(String slug) {
        if (slug.chars().allMatch(Character::isDigit)) {
            return "https://www.ozon.ru/context/detail/id/" + slug + "/";
        }
        return "https://www.ozon.ru/product/" + slug + "/";
    }

    private static String normalizeSlug(String productSlug, String originalUrl) {
        String slug = extractSlug(productSlug);
        if (slug == null || slug.isBlank()) {
            slug = extractSlug(originalUrl);
        }
        return slug;
    }

    private static void mergeWidget(Builder builder, String widgetKey, JsonNode rawState) {
        JsonNode widget = parseWidgetState(rawState);
        if (widget == null) {
            return;
        }
        if (widgetKey.contains("webSale")) {
            mergeSale(builder, widget);
        }
        if (widgetKey.contains("webGallery")) {
            mergeGallery(builder, widget);
        }
        if (widgetKey.contains("webAspects") || widgetKey.contains("webAddToCart")) {
            mergeAspects(builder, widget);
        }
        if (widgetKey.contains("webShortCharacteristics") || widgetKey.contains("webCharacteristics")) {
            mergeCharacteristics(builder, widget);
        }
    }

    private static JsonNode parseWidgetState(JsonNode rawState) {
        if (rawState == null || rawState.isMissingNode() || rawState.isNull()) {
            return null;
        }
        if (rawState.isTextual()) {
            try {
                return new ObjectMapper().readTree(rawState.asText());
            } catch (JsonProcessingException ex) {
                return null;
            }
        }
        return rawState;
    }

    private static void mergeSale(Builder builder, JsonNode widget) {
        JsonNode product = widget.path("cellTrackingInfo").path("product");
        if (product.isMissingNode()) {
            product = widget.path("product");
        }
        if (product.isMissingNode()) {
            return;
        }

        String title = text(product, "title");
        if (title != null) {
            builder.title = title;
        }

        String id = text(product, "id");
        if (id != null) {
            builder.productId = id;
        }

        int price = parsePriceRub(product.path("finalPrice"));
        if (price <= 0) {
            price = parsePriceRub(product.path("price"));
        }
        if (price > 0) {
            builder.priceRub = price;
        }

        double rating = product.path("rating").asDouble(0);
        if (rating > 0) {
            builder.rating = rating;
        }
    }

    private static void mergeGallery(Builder builder, JsonNode widget) {
        String cover = text(widget, "coverImage");
        if (cover != null) {
            builder.imageUrl = normalizeImageUrl(cover);
        }

        JsonNode images = widget.path("images");
        if (images.isArray()) {
            for (JsonNode image : images) {
                String src = text(image, "src");
                if (src == null) {
                    src = text(image, "url");
                }
                if (src != null) {
                    builder.imageUrl = normalizeImageUrl(src);
                    break;
                }
            }
        }

        JsonNode videos = widget.path("videos");
        if (builder.imageUrl == null && videos.isArray() && !videos.isEmpty()) {
            String preview = text(videos.get(0), "coverUrl");
            if (preview == null) {
                preview = text(videos.get(0), "previewUrl");
            }
            if (preview != null) {
                builder.imageUrl = normalizeImageUrl(preview);
            }
        }
    }

    private static void mergeAspects(Builder builder, JsonNode widget) {
        JsonNode aspects = widget.path("aspects");
        if (!aspects.isArray()) {
            aspects = widget.path("variants");
        }
        if (!aspects.isArray()) {
            return;
        }

        for (JsonNode aspect : aspects) {
            String aspectName = text(aspect, "aspectName");
            if (aspectName == null) {
                aspectName = text(aspect, "type");
            }
            if (aspectName == null) {
                aspectName = joinDescription(aspect.path("descriptionRs"));
            }
            if (aspectName != null && !isSizeAspect(aspectName)) {
                continue;
            }

            JsonNode variants = aspect.path("variants");
            if (!variants.isArray()) {
                continue;
            }
            for (JsonNode variant : variants) {
                String size = text(variant, "title");
                if (size == null) {
                    size = text(variant, "text");
                }
                if (size == null) {
                    size = text(variant, "data");
                }
                if (size != null && !size.isBlank()) {
                    builder.sizes.add(size.trim());
                }
            }
        }
    }

    private static void mergeCharacteristics(Builder builder, JsonNode widget) {
        JsonNode characteristics = widget.path("characteristics");
        if (!characteristics.isArray()) {
            characteristics = widget.path("shortCharacteristics");
        }
        if (!characteristics.isArray()) {
            return;
        }
        for (JsonNode item : characteristics) {
            String key = text(item, "key");
            if (key == null) {
                key = text(item, "name");
            }
            if (key == null || !key.toLowerCase().contains("бренд")) {
                continue;
            }
            String brand = text(item, "value");
            if (brand != null) {
                builder.brand = brand;
            }
        }
    }

    private static void mergeSeo(Builder builder, JsonNode seo) {
        if (seo.isMissingNode()) {
            return;
        }

        String seoTitle = text(seo, "title");
        if (builder.title == null && seoTitle != null) {
            builder.title = cleanupSeoTitle(seoTitle);
        }

        JsonNode scripts = seo.path("script");
        if (!scripts.isArray()) {
            return;
        }
        for (JsonNode script : scripts) {
            String innerHtml = text(script, "innerHTML");
            if (innerHtml == null) {
                continue;
            }
            try {
                mergeJsonLd(builder, new ObjectMapper().readTree(innerHtml));
            } catch (JsonProcessingException ignored) {
                // ignore malformed SEO payload
            }
        }
    }

    private static void mergeJsonLd(Builder builder, JsonNode ld) {
        if (ld == null || ld.isMissingNode()) {
            return;
        }
        if (ld.isArray()) {
            for (JsonNode item : ld) {
                mergeJsonLd(builder, item);
            }
            return;
        }

        String type = ld.path("@type").asText("");
        if (!type.isBlank() && !type.toLowerCase().contains("product")) {
            return;
        }

        String name = text(ld, "name");
        if (builder.title == null && name != null) {
            builder.title = name;
        }

        String sku = text(ld, "sku");
        if (builder.productId == null && sku != null) {
            builder.productId = sku;
        }

        JsonNode brandNode = ld.path("brand");
        if (builder.brand == null) {
            if (brandNode.isTextual()) {
                builder.brand = brandNode.asText();
            } else {
                builder.brand = text(brandNode, "name");
            }
        }

        JsonNode image = ld.path("image");
        if (builder.imageUrl == null) {
            if (image.isTextual()) {
                builder.imageUrl = normalizeImageUrl(image.asText());
            } else if (image.isArray() && !image.isEmpty()) {
                builder.imageUrl = normalizeImageUrl(image.get(0).asText());
            }
        }

        int price = parsePriceRub(ld.path("offers").path("price"));
        if (builder.priceRub <= 0 && price > 0) {
            builder.priceRub = price;
        }

        double rating = ld.path("aggregateRating").path("ratingValue").asDouble(0);
        if (builder.rating == null && rating > 0) {
            builder.rating = rating;
        }
    }

    private static int parsePriceRub(JsonNode priceNode) {
        if (priceNode.isMissingNode() || priceNode.isNull()) {
            return 0;
        }
        long raw;
        if (priceNode.isNumber()) {
            raw = priceNode.asLong();
        } else {
            String text = priceNode.asText("").replaceAll("[^0-9]", "");
            if (text.isBlank()) {
                return 0;
            }
            raw = Long.parseLong(text);
        }
        if (raw <= 0) {
            return 0;
        }
        if (raw > 100_000) {
            return (int) (raw / 100);
        }
        return (int) raw;
    }

    private static String cleanupSeoTitle(String title) {
        return title
                .replace(" купить на OZON", "")
                .replace(" купить на Ozon", "")
                .replace(" - OZON", "")
                .trim();
    }

    private static boolean isSizeAspect(String aspectName) {
        String lower = aspectName.toLowerCase();
        return lower.contains("размер") || lower.contains("size") || lower.contains("рос");
    }

    private static String joinDescription(JsonNode descriptionRs) {
        if (!descriptionRs.isArray()) {
            return null;
        }
        StringBuilder builder = new StringBuilder();
        for (JsonNode part : descriptionRs) {
            String text = text(part, "text");
            if (text != null) {
                builder.append(text);
            }
        }
        return builder.isEmpty() ? null : builder.toString();
    }

    private static String text(JsonNode node, String field) {
        if (node == null || node.isMissingNode()) {
            return null;
        }
        String value = node.path(field).asText("");
        return value.isBlank() ? null : value;
    }

    private static String unescapeHtmlAttribute(String value) {
        return value
                .replace("&quot;", "\"")
                .replace("&#34;", "\"")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">");
    }

    private static final class Builder {
        private String slug;
        private String originalUrl;
        private String productId;
        private String title;
        private String brand;
        private int priceRub;
        private Double rating;
        private String imageUrl;
        private final Set<String> sizes = new LinkedHashSet<>();

        private Builder(String slug, String originalUrl) {
            this.slug = slug;
            this.originalUrl = originalUrl;
            this.productId = extractNumericSku(slug);
        }

        private Optional<OzonProductCard> build() {
            if (productId == null) {
                productId = extractNumericSku(slug);
            }
            if (title == null || imageUrl == null) {
                return Optional.empty();
            }
            if (brand == null || brand.isBlank()) {
                brand = "Ozon";
            }
            if (priceRub <= 0) {
                priceRub = 0;
            }
            List<String> sizeList = sizes.isEmpty() ? List.of("XS", "S", "M", "L", "XL") : new ArrayList<>(sizes);
            return Optional.of(new OzonProductCard(
                    productId == null ? slug : productId,
                    slug,
                    title,
                    brand,
                    priceRub,
                    rating,
                    imageUrl,
                    sizeList,
                    originalUrl
            ));
        }
    }

    public record OzonProductCard(
            String productId,
            String slug,
            String title,
            String brand,
            int priceRub,
            Double rating,
            String imageUrl,
            List<String> sizes,
            String originalUrl
    ) {
    }
}
