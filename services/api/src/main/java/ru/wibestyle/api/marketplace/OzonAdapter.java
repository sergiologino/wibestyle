package ru.wibestyle.api.marketplace;

import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class OzonAdapter implements MarketplaceAdapter {

    private static final java.util.regex.Pattern PRODUCT_ID = java.util.regex.Pattern.compile("/product/([^/?#]+)");

    private final OzonCatalog catalog;

    public OzonAdapter(OzonCatalog catalog) {
        this.catalog = catalog;
    }

    @Override
    public String marketplaceId() {
        return "ozon";
    }

    @Override
    public boolean canHandle(String url) {
        return url.toLowerCase().contains("ozon");
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
        var contextMatcher = java.util.regex.Pattern.compile("/context/detail/id/(\\d+)").matcher(url);
        if (contextMatcher.find()) {
            return contextMatcher.group(1);
        }
        return null;
    }

    @Override
    public ProductDetails fetchProduct(String productId, String url) {
        String id = productId == null ? "unknown" : productId;
        return catalog.fetchProductCard(id, url)
                .map(card -> {
                    if (!hasDownloadableImage(card)) {
                        throw new IllegalArgumentException("PRODUCT_IMAGE_NOT_FOUND");
                    }
                    return new ProductDetails(
                            marketplaceId(),
                            card.productId(),
                            card.title(),
                            card.brand(),
                            card.priceRub(),
                            card.rating() == null ? 4.5 : card.rating(),
                            List.of(proxyImagePath(card.slug())),
                            List.of("clothing"),
                            card.sizes(),
                            null,
                            url,
                            card.originalUrl() == null || card.originalUrl().isBlank()
                                    ? "https://www.ozon.ru/product/" + card.slug() + "/"
                                    : card.originalUrl()
                    );
                })
                .orElseThrow(() -> new IllegalArgumentException("PRODUCT_PARSE_FAILED"));
    }

    public byte[] loadProductImage(String productId, String originalUrl) {
        byte[] image = catalog.downloadProductImage(productId, originalUrl);
        if (image != null && image.length > 0) {
            return image;
        }
        throw new IllegalArgumentException("PRODUCT_IMAGE_NOT_FOUND");
    }

    private boolean hasDownloadableImage(OzonCatalog.OzonProductCard card) {
        byte[] image = catalog.downloadImage(card.imageUrl());
        return image != null && image.length > 0;
    }

    static String proxyImagePath(String productId) {
        return "/api/v1/marketplaces/ozon/" + productId + "/image";
    }
}
