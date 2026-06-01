package ru.wibestyle.api.marketplace;

import org.springframework.stereotype.Component;

@Component
public class OzonMediaRules implements MarketplaceMediaRules {

    @Override
    public String marketplaceId() {
        return "ozon";
    }

    @Override
    public boolean isVideoMediaUrl(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        String lower = url.toLowerCase();
        return lower.contains("/video/")
                || lower.endsWith(".mp4")
                || lower.endsWith(".webm")
                || lower.endsWith(".m3u8");
    }

    @Override
    public boolean isProductImageBytes(byte[] data) {
        return WildberriesMediaUtils.isProductImageBytes(data);
    }
}
