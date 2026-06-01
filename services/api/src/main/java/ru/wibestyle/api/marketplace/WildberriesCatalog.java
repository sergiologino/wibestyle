package ru.wibestyle.api.marketplace;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class WildberriesCatalog {

    static final int MAX_PRODUCT_IMAGE_INDEX = WildberriesMediaRules.MAX_PRODUCT_IMAGE_INDEX;

    private static final String WB_USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

    private final RestClient restClient;
    private final RestClient imageRestClient;
    private final RestClient pageRestClient;
    private final SizeChartExtractor sizeChartExtractor;
    private final WildberriesBasketResolver basketResolver;
    private final WildberriesMediaRules mediaRules;

    public WildberriesCatalog(
            RestClient.Builder restClientBuilder,
            SizeChartExtractor sizeChartExtractor,
            WildberriesBasketResolver basketResolver,
            WildberriesMediaRules mediaRules
    ) {
        this.restClient = restClientBuilder
                .defaultHeader("User-Agent", WB_USER_AGENT)
                .defaultHeader("Accept", "application/json")
                .build();
        this.imageRestClient = restClientBuilder
                .defaultHeader("User-Agent", WB_USER_AGENT)
                .defaultHeader("Accept", "image/avif,image/webp,image/apng,image/*,*/*;q=0.8")
                .build();
        this.pageRestClient = restClientBuilder
                .defaultHeader("User-Agent", WB_USER_AGENT)
                .defaultHeader("Accept-Language", "ru-RU,ru;q=0.9")
                .defaultHeader("Accept", "text/html,application/xhtml+xml")
                .build();
        this.sizeChartExtractor = sizeChartExtractor;
        this.basketResolver = basketResolver;
        this.mediaRules = mediaRules;
    }

    public Optional<WbProductCard> fetchProductCard(String productId) {
        return fetchProductCard(productId, null);
    }

    public Optional<WbProductCard> fetchProductCard(String productId, String productPageUrl) {
        long article;
        try {
            article = Long.parseLong(productId);
        } catch (NumberFormatException ex) {
            return Optional.empty();
        }

        Optional<WildberriesBasketResolver.ResolvedBasketCard> resolved = basketResolver.resolveCard(article);
        if (resolved.isPresent()) {
            WildberriesBasketResolver.ResolvedBasketCard basketCard = resolved.get();
            String productUrl = productPageUrl == null || productPageUrl.isBlank()
                    ? "https://www.wildberries.ru/catalog/" + article + "/detail.aspx"
                    : productPageUrl;
            long vol = article / 100_000;
            long part = article / 1_000;
            String productJson = fetchProductJsonText(basketCard.host(), vol, part, article);
            ProductSizeChart chart = sizeChartExtractor.extract(productUrl, basketCard.card(), productJson);
            return Optional.of(parseCard(article, basketCard.host(), basketCard.card(), chart));
        }

        Optional<WbProductCard> fromPageGallery = fetchFromPageGallery(article, productPageUrl);
        if (fromPageGallery.isPresent()) {
            return fromPageGallery;
        }

        return fetchFromCardApi(article);
    }

    private Optional<WbProductCard> fetchFromPageGallery(long article, String productPageUrl) {
        String pageUrl = productPageUrl == null || productPageUrl.isBlank()
                ? "https://www.wildberries.ru/catalog/" + article + "/detail.aspx"
                : productPageUrl;
        List<String> galleryUrls = fetchGalleryPhotoUrls(pageUrl, article);
        if (galleryUrls.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(new WbProductCard(
                Long.toString(article),
                "Товар Wildberries",
                "Brand Look",
                4290,
                galleryUrls.get(0),
                List.of("XS", "S", "M", "L", "XL"),
                ProductSizeChart.empty(),
                galleryUrls.size()
        ));
    }

    Optional<WbProductCard> fetchFromCardApi(long article) {
        String url = "https://card.wb.ru/cards/v2/detail?appType=1&curr=rub&dest=-1257786&spp=30&nm=" + article;
        try {
            JsonNode response = restClient.get().uri(url).retrieve().body(JsonNode.class);
            if (response == null || response.isMissingNode()) {
                return Optional.empty();
            }
            JsonNode products = response.path("data").path("products");
            if (!products.isArray() || products.isEmpty()) {
                return Optional.empty();
            }
            JsonNode product = products.get(0);
            if (product == null || product.isMissingNode()) {
                return Optional.empty();
            }

            String title = text(product, "name", "Товар Wildberries");
            String brand = text(product, "brand", "Brand Look");
            int priceRub = product.path("salePriceU").asInt(0);
            if (priceRub <= 0) {
                priceRub = product.path("priceU").asInt(0);
            }
            if (priceRub > 0) {
                priceRub = priceRub / 100;
            }
            if (priceRub <= 0) {
                priceRub = 4290;
            }

            List<String> sizes = parseCardApiSizes(product);
            if (sizes.isEmpty()) {
                sizes = List.of("XS", "S", "M", "L", "XL");
            }

            int photoCount = resolvePhotoCount(product, null);
            String host = basketResolver.resolveBasketHost(article)
                    .orElseGet(() -> resolveBasketHost(article / 100_000));
            String imageUrl = resolvePreviewImageUrl(article, host, photoCount);
            return Optional.of(new WbProductCard(
                    Long.toString(article),
                    title,
                    brand,
                    priceRub,
                    imageUrl,
                    sizes,
                    ProductSizeChart.empty(),
                    photoCount
            ));
        } catch (RestClientException ignored) {
            return Optional.empty();
        }
    }

    private String fetchProductJsonText(String host, long vol, long part, long article) {
        String productUrl = host + "/vol" + vol + "/part" + part + "/" + article + "/info/ru/product.json";
        try {
            String body = restClient.get().uri(productUrl).retrieve().body(String.class);
            return body == null ? "" : body;
        } catch (RestClientException ex) {
            return "";
        }
    }

    public String buildImageUrl(long article, String host) {
        return buildImageUrl(article, host, 1);
    }

    public String buildImageUrl(long article, String host, int imageIndex) {
        return mediaRules.buildImageUrl(article, host, imageIndex);
    }

    public byte[] downloadImage(String imageUrl) {
        if (mediaRules.isVideoMediaUrl(imageUrl)) {
            return null;
        }
        try {
            byte[] body = imageRestClient.get().uri(imageUrl).retrieve().body(byte[].class);
            if (mediaRules.isProductImageBytes(body)) {
                return body;
            }
        } catch (RestClientException ignored) {
            // try next candidate
        }
        return null;
    }

    /** Fast check for parse-link: HEAD/GET first photo candidate without full card re-download loop. */
    public boolean probeProductImage(String productId, String productPageUrl) {
        for (String candidate : listPhotoCandidates(productId, productPageUrl)) {
            if (probeImageUrl(candidate)) {
                return true;
            }
        }
        return false;
    }

    public byte[] downloadProductImage(String productId) {
        return downloadProductImage(productId, null);
    }

    /** Downloads first gallery photo; skips video slots by URL rules and response bytes. */
    public byte[] downloadProductImage(String productId, String productPageUrl) {
        for (String candidate : listPhotoCandidates(productId, productPageUrl)) {
            byte[] image = downloadImage(candidate);
            if (image != null) {
                return image;
            }
        }
        return null;
    }

    private List<String> listPhotoCandidates(String productId, String productPageUrl) {
        long article;
        try {
            article = Long.parseLong(productId);
        } catch (NumberFormatException ex) {
            return List.of();
        }

        LinkedHashSet<String> candidates = new LinkedHashSet<>();

        Optional<WildberriesBasketResolver.ResolvedBasketCard> resolved = basketResolver.resolveCard(article);
        if (resolved.isPresent()) {
            int photoCount = resolvePhotoCount(null, resolved.get().card());
            candidates.addAll(mediaRules.photoDownloadCandidates(article, resolved.get().host(), photoCount));
        }

        String pageUrl = productPageUrl == null || productPageUrl.isBlank()
                ? "https://www.wildberries.ru/catalog/" + article + "/detail.aspx"
                : productPageUrl;
        candidates.addAll(fetchGalleryPhotoUrls(pageUrl, article));

        if (resolved.isEmpty()) {
            long vol = article / 100_000;
            for (String host : WildberriesBasketResolver.orderedBasketHosts(vol)) {
                candidates.addAll(mediaRules.photoDownloadCandidates(article, host, 3));
            }
        }

        return new ArrayList<>(candidates);
    }

    private List<String> fetchGalleryPhotoUrls(String productPageUrl, long article) {
        if (productPageUrl == null || productPageUrl.isBlank()) {
            return List.of();
        }
        try {
            String html = pageRestClient.get().uri(productPageUrl).retrieve().body(String.class);
            return WildberriesGalleryExtractor.extractPhotoUrls(html, article);
        } catch (RestClientException ignored) {
            return List.of();
        }
    }

    private boolean probeImageUrl(String imageUrl) {
        if (mediaRules.isVideoMediaUrl(imageUrl)) {
            return false;
        }
        try {
            var response = imageRestClient.head().uri(imageUrl).retrieve().toBodilessEntity();
            return response.getStatusCode().is2xxSuccessful();
        } catch (RestClientException ignored) {
            return downloadImage(imageUrl) != null;
        }
    }

    public String resolveImageUrl(String productId) {
        long article = Long.parseLong(productId);
        Optional<WbProductCard> card = fetchProductCard(productId);
        if (card.isPresent()) {
            return card.get().imageUrl();
        }
        long vol = article / 100_000;
        String host = WildberriesBasketResolver.orderedBasketHosts(vol).get(0);
        return buildImageUrl(article, host);
    }

    private static String extractHost(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return null;
        }
        int schemeEnd = imageUrl.indexOf("://");
        if (schemeEnd < 0) {
            return null;
        }
        int pathStart = imageUrl.indexOf('/', schemeEnd + 3);
        return pathStart > 0 ? imageUrl.substring(0, pathStart) : imageUrl;
    }

    private WbProductCard parseCard(long article, String host, JsonNode card, ProductSizeChart sizeChart) {
        String title = text(card, "imt_name", "Лёгкое платье миди");
        String brand = card.path("selling").path("brand_name").asText("Brand Look");
        int priceRub = card.path("salePriceU").asInt(0);
        if (priceRub <= 0) {
            priceRub = card.path("priceU").asInt(429000) / 100;
        } else {
            priceRub = priceRub / 100;
        }
        if (priceRub <= 0) {
            priceRub = 4290;
        }

        List<String> sizes = parseSizes(card);
        if (sizes.isEmpty()) {
            sizes = List.of("XS", "S", "M", "L", "XL");
        }

        int photoCount = resolvePhotoCount(null, card);
        return new WbProductCard(
                Long.toString(article),
                title,
                brand,
                priceRub,
                resolvePreviewImageUrl(article, host, photoCount),
                sizes,
                sizeChart,
                photoCount
        );
    }

    private String resolvePreviewImageUrl(long article, String host, int photoCount) {
        int maxIndex = Math.max(1, Math.min(photoCount > 0 ? photoCount : MAX_PRODUCT_IMAGE_INDEX, MAX_PRODUCT_IMAGE_INDEX));
        for (int imageIndex = 1; imageIndex <= maxIndex; imageIndex++) {
            String candidate = buildImageUrl(article, host, imageIndex);
            if (!mediaRules.isVideoMediaUrl(candidate)) {
                return candidate;
            }
        }
        return buildImageUrl(article, host);
    }

    private static int resolvePhotoCount(JsonNode cardApiProduct, JsonNode cardJson) {
        if (cardJson != null && !cardJson.isMissingNode()) {
            JsonNode media = cardJson.path("media");
            int photoCount = media.path("photo_count").asInt(0);
            if (photoCount > 0) {
                return photoCount;
            }
        }
        if (cardApiProduct != null && !cardApiProduct.isMissingNode()) {
            int pics = cardApiProduct.path("pics").asInt(0);
            if (pics > 0) {
                return pics;
            }
        }
        return MAX_PRODUCT_IMAGE_INDEX;
    }

    private List<String> parseSizes(JsonNode card) {
        Set<String> sizes = new LinkedHashSet<>();
        JsonNode sizesNode = card.path("sizes");
        if (sizesNode.isArray()) {
            for (JsonNode size : sizesNode) {
                String techSize = size.path("tech_size").asText(null);
                if (techSize != null && !techSize.isBlank() && !"0".equals(techSize)) {
                    sizes.add(techSize.trim());
                }
                String wbSize = size.path("wb_size").asText(null);
                if (wbSize != null && !wbSize.isBlank()) {
                    sizes.add(wbSize.trim());
                }
            }
        }
        return new ArrayList<>(sizes);
    }

    private static String text(JsonNode node, String field, String fallback) {
        String value = node.path(field).asText("");
        return value.isBlank() ? fallback : value;
    }

    static List<String> basketHostsToTry(long vol) {
        return WildberriesBasketResolver.orderedBasketHosts(vol);
    }

    static String resolveBasketHost(long vol) {
        if (vol <= 143) {
            return "https://basket-01.wbbasket.ru";
        }
        if (vol <= 287) {
            return "https://basket-02.wbbasket.ru";
        }
        if (vol <= 431) {
            return "https://basket-03.wbbasket.ru";
        }
        if (vol <= 719) {
            return "https://basket-04.wbbasket.ru";
        }
        if (vol <= 1007) {
            return "https://basket-05.wbbasket.ru";
        }
        if (vol <= 1061) {
            return "https://basket-06.wbbasket.ru";
        }
        if (vol <= 1115) {
            return "https://basket-07.wbbasket.ru";
        }
        if (vol <= 1169) {
            return "https://basket-08.wbbasket.ru";
        }
        if (vol <= 1313) {
            return "https://basket-09.wbbasket.ru";
        }
        if (vol <= 1601) {
            return "https://basket-10.wbbasket.ru";
        }
        if (vol <= 1655) {
            return "https://basket-11.wbbasket.ru";
        }
        if (vol <= 1919) {
            return "https://basket-12.wbbasket.ru";
        }
        if (vol <= 2045) {
            return "https://basket-13.wbbasket.ru";
        }
        if (vol <= 2189) {
            return "https://basket-14.wbbasket.ru";
        }
        if (vol <= 2405) {
            return "https://basket-15.wbbasket.ru";
        }
        if (vol <= 2621) {
            return "https://basket-16.wbbasket.ru";
        }
        if (vol <= 2837) {
            return "https://basket-17.wbbasket.ru";
        }
        if (vol <= 3053) {
            return "https://basket-18.wbbasket.ru";
        }
        if (vol <= 3269) {
            return "https://basket-19.wbbasket.ru";
        }
        if (vol <= 3485) {
            return "https://basket-20.wbbasket.ru";
        }
        if (vol <= 3701) {
            return "https://basket-21.wbbasket.ru";
        }
        if (vol <= 3917) {
            return "https://basket-22.wbbasket.ru";
        }
        if (vol <= 4133) {
            return "https://basket-23.wbbasket.ru";
        }
        if (vol <= 4349) {
            return "https://basket-24.wbbasket.ru";
        }
        if (vol <= 4565) {
            return "https://basket-25.wbbasket.ru";
        }
        if (vol <= 4781) {
            return "https://basket-26.wbbasket.ru";
        }
        if (vol <= 4997) {
            return "https://basket-27.wbbasket.ru";
        }
        if (vol <= 5213) {
            return "https://basket-28.wbbasket.ru";
        }
        if (vol <= 5429) {
            return "https://basket-29.wbbasket.ru";
        }
        if (vol <= 5645) {
            return "https://basket-30.wbbasket.ru";
        }
        if (vol <= 5861) {
            return "https://basket-31.wbbasket.ru";
        }
        if (vol <= 6077) {
            return "https://basket-32.wbbasket.ru";
        }
        if (vol <= 6293) {
            return "https://basket-33.wbbasket.ru";
        }
        if (vol <= 6509) {
            return "https://basket-34.wbbasket.ru";
        }
        if (vol <= 6725) {
            return "https://basket-35.wbbasket.ru";
        }
        if (vol <= 6941) {
            return "https://basket-36.wbbasket.ru";
        }
        if (vol <= 7157) {
            return "https://basket-37.wbbasket.ru";
        }
        if (vol <= 7373) {
            return "https://basket-38.wbbasket.ru";
        }
        if (vol <= 7589) {
            return "https://basket-39.wbbasket.ru";
        }
        return "https://basket-40.wbbasket.ru";
    }

    private List<String> parseCardApiSizes(JsonNode product) {
        Set<String> sizes = new LinkedHashSet<>();
        JsonNode sizesNode = product.path("sizes");
        if (sizesNode.isArray()) {
            for (JsonNode size : sizesNode) {
                String name = size.path("name").asText(null);
                if (name != null && !name.isBlank()) {
                    sizes.add(name.trim());
                }
            }
        }
        return new ArrayList<>(sizes);
    }

    public record WbProductCard(
            String productId,
            String title,
            String brand,
            int priceRub,
            String imageUrl,
            List<String> sizes,
            ProductSizeChart sizeChart,
            int photoCount
    ) {
        WbProductCard(
                String productId,
                String title,
                String brand,
                int priceRub,
                String imageUrl,
                List<String> sizes,
                ProductSizeChart sizeChart
        ) {
            this(productId, title, brand, priceRub, imageUrl, sizes, sizeChart, 0);
        }
    }
}
