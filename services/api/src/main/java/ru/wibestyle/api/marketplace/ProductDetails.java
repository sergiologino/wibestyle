package ru.wibestyle.api.marketplace;

import java.util.List;

public record ProductDetails(
        String marketplace,
        String externalProductId,
        String title,
        String brand,
        int priceRub,
        Double rating,
        List<String> images,
        List<String> categories,
        List<String> availableSizes,
        String selectedSize,
        String originalUrl,
        String canonicalUrl,
        ProductSizeChart sizeChart
) {
    public ProductDetails(
            String marketplace,
            String externalProductId,
            String title,
            String brand,
            int priceRub,
            Double rating,
            List<String> images,
            List<String> categories,
            List<String> availableSizes,
            String selectedSize,
            String originalUrl,
            String canonicalUrl
    ) {
        this(
                marketplace,
                externalProductId,
                title,
                brand,
                priceRub,
                rating,
                images,
                categories,
                availableSizes,
                selectedSize,
                originalUrl,
                canonicalUrl,
                ProductSizeChart.empty()
        );
    }
}
