package ru.wibestyle.api.marketplace;

/**
 * Per-marketplace rules for telling product photos apart from videos and building CDN URLs.
 */
public interface MarketplaceMediaRules {

    String marketplaceId();

    boolean isVideoMediaUrl(String url);

    boolean isProductImageBytes(byte[] data);
}
