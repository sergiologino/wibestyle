package ru.wibestyle.api.marketplace;

import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class WildberriesAdapter implements MarketplaceAdapter {

    private static final java.util.regex.Pattern PRODUCT_ID = java.util.regex.Pattern.compile("/catalog/(\\d+)/");

    private final WildberriesCatalog catalog;

    public WildberriesAdapter(WildberriesCatalog catalog) {
        this.catalog = catalog;
    }

    @Override
    public String marketplaceId() {
        return "wildberries";
    }

    @Override
    public boolean canHandle(String url) {
        String lower = url.toLowerCase();
        return lower.contains("wildberries") || lower.contains("wb.ru");
    }

    @Override
    public String normalizeUrl(String url) {
        return url.trim();
    }

    @Override
    public String extractProductId(String url) {
        var matcher = PRODUCT_ID.matcher(url);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    @Override
    public ProductDetails fetchProduct(String productId, String url) {
        String id = productId == null ? "unknown" : productId;
        return catalog.fetchProductCard(id, url)
                .map(card -> {
                    if (!catalog.probeProductImage(card.productId(), url)) {
                        throw new IllegalArgumentException("PRODUCT_IMAGE_NOT_FOUND");
                    }
                    return new ProductDetails(
                            marketplaceId(),
                            card.productId(),
                            card.title(),
                            card.brand(),
                            card.priceRub(),
                            4.7,
                            List.of(proxyImagePath(card.productId())),
                            List.of("dress"),
                            card.sizes(),
                            null,
                            url,
                            "https://www.wildberries.ru/catalog/" + card.productId() + "/detail.aspx",
                            card.sizeChart()
                    );
                })
                .orElseThrow(() -> new IllegalArgumentException("PRODUCT_PARSE_FAILED"));
    }

    public byte[] loadProductImage(String productId) {
        byte[] image = catalog.downloadProductImage(productId);
        if (image != null && image.length > 0) {
            return image;
        }
        throw new IllegalArgumentException("PRODUCT_IMAGE_NOT_FOUND");
    }

    static String proxyImagePath(String productId) {
        return "/api/v1/marketplaces/wildberries/" + productId + "/image";
    }
}
