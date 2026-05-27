package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import ru.wibestyle.api.domain.AvatarSnapshotEntity;
import ru.wibestyle.api.domain.TryOnErrorCodes;
import ru.wibestyle.api.marketplace.MarketplaceAdapter;
import ru.wibestyle.api.marketplace.MarketplaceAdapterRegistry;
import ru.wibestyle.api.marketplace.ProductDetails;
import ru.wibestyle.api.marketplace.ProductSizeChart;
import ru.wibestyle.api.marketplace.SizeChartEntry;
import ru.wibestyle.api.marketplace.SizeChartFitMatcher;
import ru.wibestyle.api.marketplace.WildberriesAdapter;
import ru.wibestyle.api.repository.AvatarSnapshotRepository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class MarketplaceService {

    private final MarketplaceAdapterRegistry marketplaceAdapterRegistry;
    private final WildberriesAdapter wildberriesAdapter;
    private final AvatarSnapshotRepository avatarSnapshotRepository;

    public MarketplaceService(
            MarketplaceAdapterRegistry marketplaceAdapterRegistry,
            WildberriesAdapter wildberriesAdapter,
            AvatarSnapshotRepository avatarSnapshotRepository
    ) {
        this.marketplaceAdapterRegistry = marketplaceAdapterRegistry;
        this.wildberriesAdapter = wildberriesAdapter;
        this.avatarSnapshotRepository = avatarSnapshotRepository;
    }

    public Map<String, Object> parseLink(String url) {
        return parseLink(url, null);
    }

    public Map<String, Object> parseLink(String url, UUID userId) {
        MarketplaceAdapter adapter = marketplaceAdapterRegistry.resolve(url);
        String normalizedUrl = adapter.normalizeUrl(url);
        String productId = adapter.extractProductId(normalizedUrl);
        ProductDetails product;
        try {
            product = adapter.fetchProduct(productId, normalizedUrl);
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException(TryOnErrorCodes.PRODUCT_PARSE_FAILED, ex);
        }

        if (product.images() == null || product.images().isEmpty()) {
            throw new IllegalArgumentException(TryOnErrorCodes.PRODUCT_IMAGE_NOT_FOUND);
        }

        Map<String, Object> preview = toProductPreview(product);
        if (userId != null) {
            avatarSnapshotRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                    .ifPresent(snapshot -> applySuggestedSize(preview, product, snapshot));
        }
        return Map.of("product", preview);
    }

    public byte[] loadWildberriesImage(String productId) {
        return wildberriesAdapter.loadProductImage(productId);
    }

    private void applySuggestedSize(Map<String, Object> preview, ProductDetails product, AvatarSnapshotEntity snapshot) {
        ProductSizeChart chart = product.sizeChart();
        if (!chart.found()) {
            return;
        }
        Optional<String> suggested = SizeChartFitMatcher.recommend(
                chart,
                snapshot,
                product.availableSizes() == null ? List.of() : product.availableSizes()
        );
        suggested.ifPresent(size -> preview.put("suggestedSize", size));
        preview.put("sizeChart", toSizeChartMap(chart));
    }

    private Map<String, Object> toProductPreview(ProductDetails product) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", product.externalProductId() == null ? "product_" + UUID.randomUUID() : product.externalProductId());
        map.put("marketplace", product.marketplace());
        map.put("title", product.title());
        map.put("brand", product.brand());
        map.put("priceRub", product.priceRub());
        map.put("imageUrl", product.images().get(0));
        map.put("sizes", product.availableSizes() == null ? List.of() : product.availableSizes());
        map.put("productUrl", product.originalUrl());
        if (product.rating() != null) {
            map.put("rating", product.rating());
        }
        if (product.categories() != null) {
            map.put("categories", product.categories());
        }
        if (product.sizeChart() != null && product.sizeChart().found()) {
            map.put("sizeChart", toSizeChartMap(product.sizeChart()));
        }
        return map;
    }

    private static Map<String, Object> toSizeChartMap(ProductSizeChart chart) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("found", chart.found());
        map.put("source", chart.source());
        List<Map<String, Object>> rows = new ArrayList<>();
        for (SizeChartEntry entry : chart.entries()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("label", entry.label());
            if (entry.bustMinCm() != null || entry.bustMaxCm() != null) {
                row.put("bustCm", range(entry.bustMinCm(), entry.bustMaxCm()));
            }
            if (entry.waistMinCm() != null || entry.waistMaxCm() != null) {
                row.put("waistCm", range(entry.waistMinCm(), entry.waistMaxCm()));
            }
            if (entry.hipsMinCm() != null || entry.hipsMaxCm() != null) {
                row.put("hipsCm", range(entry.hipsMinCm(), entry.hipsMaxCm()));
            }
            rows.add(row);
        }
        map.put("rows", rows);
        return map;
    }

    private static String range(Integer min, Integer max) {
        if (min == null && max == null) {
            return null;
        }
        if (min == null) {
            return max + " см";
        }
        if (max == null) {
            return min + " см";
        }
        return min + "–" + max + " см";
    }
}
