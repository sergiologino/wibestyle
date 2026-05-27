package ru.wibestyle.api.marketplace;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class WildberriesCatalog {

    private static final String WB_USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

    private final RestClient restClient;
    private final SizeChartExtractor sizeChartExtractor;

    public WildberriesCatalog(RestClient.Builder restClientBuilder, SizeChartExtractor sizeChartExtractor) {
        this.restClient = restClientBuilder
                .defaultHeader("User-Agent", WB_USER_AGENT)
                .defaultHeader("Accept", "application/json")
                .build();
        this.sizeChartExtractor = sizeChartExtractor;
    }

    public Optional<WbProductCard> fetchProductCard(String productId) {
        long article;
        try {
            article = Long.parseLong(productId);
        } catch (NumberFormatException ex) {
            return Optional.empty();
        }

        Optional<WbProductCard> fromCardApi = fetchFromCardApi(article);
        if (fromCardApi.isPresent()) {
            return fromCardApi;
        }

        long vol = article / 100_000;
        long part = article / 1_000;
        for (String host : basketHostsToTry(vol)) {
            String cardUrl = host + "/vol" + vol + "/part" + part + "/" + article + "/info/ru/card.json";
            try {
                JsonNode card = restClient.get().uri(cardUrl).retrieve().body(JsonNode.class);
                if (card != null && !card.isMissingNode()) {
                    String productUrl = "https://www.wildberries.ru/catalog/" + article + "/detail.aspx";
                    String productJson = fetchProductJsonText(host, vol, part, article);
                    ProductSizeChart chart = sizeChartExtractor.extract(productUrl, card, productJson);
                    return Optional.of(parseCard(article, host, card, chart));
                }
            } catch (RestClientException ignored) {
                // try next basket host
            }
        }
        return Optional.empty();
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

            long vol = article / 100_000;
            String host = resolveBasketHost(vol);
            String imageUrl = buildImageUrl(article, host);
            return Optional.of(new WbProductCard(
                    Long.toString(article),
                    title,
                    brand,
                    priceRub,
                    imageUrl,
                    sizes,
                    ProductSizeChart.empty()
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
        long vol = article / 100_000;
        long part = article / 1_000;
        int idx = Math.max(1, Math.min(imageIndex, 15));
        return host + "/vol" + vol + "/part" + part + "/" + article + "/images/big/" + idx + ".webp";
    }

    public byte[] downloadImage(String imageUrl) {
        try {
            byte[] body = restClient.get().uri(imageUrl).retrieve().body(byte[].class);
            if (body != null && body.length > 0) {
                return body;
            }
        } catch (RestClientException ignored) {
            // try next candidate
        }
        return null;
    }

    /** Tries basket hosts and image indices until WB CDN returns bytes. */
    public byte[] downloadProductImage(String productId) {
        long article;
        try {
            article = Long.parseLong(productId);
        } catch (NumberFormatException ex) {
            return null;
        }

        Optional<WbProductCard> card = fetchProductCard(productId);
        if (card.isPresent()) {
            String host = extractHost(card.get().imageUrl());
            if (host != null) {
                for (int imageIndex = 1; imageIndex <= 5; imageIndex++) {
                    byte[] fromCardHost = downloadImage(buildImageUrl(article, host, imageIndex));
                    if (fromCardHost != null) {
                        return fromCardHost;
                    }
                }
            }
        }

        long vol = article / 100_000;
        for (String host : basketHostsToTry(vol)) {
            for (int imageIndex = 1; imageIndex <= 5; imageIndex++) {
                byte[] image = downloadImage(buildImageUrl(article, host, imageIndex));
                if (image != null) {
                    return image;
                }
            }
        }
        return null;
    }

    public String resolveImageUrl(String productId) {
        long article = Long.parseLong(productId);
        Optional<WbProductCard> card = fetchProductCard(productId);
        if (card.isPresent()) {
            return card.get().imageUrl();
        }
        long vol = article / 100_000;
        String host = basketHostsToTry(vol).get(0);
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

        return new WbProductCard(
                Long.toString(article),
                title,
                brand,
                priceRub,
                buildImageUrl(article, host),
                sizes,
                sizeChart
        );
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
        List<String> hosts = new ArrayList<>();
        hosts.add(resolveBasketHost(vol));
        for (int basket = 1; basket <= 40; basket++) {
            String host = "https://basket-%02d.wbbasket.ru".formatted(basket);
            if (!hosts.contains(host)) {
                hosts.add(host);
            }
        }
        return hosts;
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
            ProductSizeChart sizeChart
    ) {
    }
}
