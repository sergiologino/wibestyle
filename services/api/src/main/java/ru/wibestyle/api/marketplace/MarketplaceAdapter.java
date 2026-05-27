package ru.wibestyle.api.marketplace;

public interface MarketplaceAdapter {

    String marketplaceId();

    boolean canHandle(String url);

    String normalizeUrl(String url);

    String extractProductId(String url);

    ProductDetails fetchProduct(String productId, String url);
}
