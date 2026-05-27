package ru.wibestyle.api.marketplace;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class OzonAdapter implements MarketplaceAdapter {

    private static final Pattern PRODUCT_ID = Pattern.compile("/product/([^/?#]+)");

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
        Matcher matcher = PRODUCT_ID.matcher(url);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    @Override
    public ProductDetails fetchProduct(String productId, String url) {
        String id = productId == null ? "unknown" : productId;
        return new ProductDetails(
                marketplaceId(),
                id,
                "Пиджак oversize",
                "Urban Line",
                6890,
                4.5,
                List.of("/assets/demo-garment.svg"),
                List.of("jacket"),
                List.of("XS", "S", "M", "L", "XL"),
                null,
                url,
                "https://www.ozon.ru/product/" + id
        );
    }
}
