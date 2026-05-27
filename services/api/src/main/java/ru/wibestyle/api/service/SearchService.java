package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import ru.wibestyle.api.config.FeatureFlagsProperties;
import ru.wibestyle.api.search.SearchQueryUnderstandingService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SearchService {

    private final SearchQueryUnderstandingService queryUnderstandingService;
    private final FeatureFlagsProperties featureFlagsProperties;

    public SearchService(
            SearchQueryUnderstandingService queryUnderstandingService,
            FeatureFlagsProperties featureFlagsProperties
    ) {
        this.queryUnderstandingService = queryUnderstandingService;
        this.featureFlagsProperties = featureFlagsProperties;
    }

    public Map<String, Object> search(String query, String marketplace) {
        if (!featureFlagsProperties.isEnabled("search")) {
            throw new IllegalArgumentException("SEARCH_DISABLED");
        }

        SearchQueryUnderstandingService.ParsedQuery parsed = queryUnderstandingService.parse(query);
        List<Map<String, Object>> items = buildResults(parsed, marketplace);

        Map<String, Object> response = new HashMap<>();
        response.put("query", parsed.originalQuery());
        response.put("expandedQuery", parsed.expandedQuery());
        response.put("facets", parsed.facets());
        response.put("trendNote", buildTrendNote(parsed));
        response.put("items", items);
        return response;
    }

    private String buildTrendNote(SearchQueryUnderstandingService.ParsedQuery parsed) {
        Integer year = (Integer) parsed.facets().get("year");
        if (year != null && year >= 2026) {
            return "Подбор с учётом сезона и стиля. Тренды " + year + " — осторожная формулировка без внешних источников.";
        }
        if ("fashion_trend".equals(parsed.facets().get("styleIntent"))) {
            return "Подбор с учётом модных формулировок запроса — без утверждения официального тренда.";
        }
        return null;
    }

    private List<Map<String, Object>> buildResults(
            SearchQueryUnderstandingService.ParsedQuery parsed,
            String marketplaceFilter
    ) {
        String category = String.valueOf(parsed.facets().get("category"));
        List<Map<String, Object>> items = new ArrayList<>();

        items.add(product(
                "wb_" + UUID.randomUUID().toString().substring(0, 8),
                "wildberries",
                titleFor(category, "Urban Line"),
                "Urban Line",
                6890,
                4.6,
                "Лёгкий силуэт, подходит для warm season looks.",
                List.of("S", "M", "L", "XL")
        ));
        items.add(product(
                "oz_" + UUID.randomUUID().toString().substring(0, 8),
                "ozon",
                titleFor(category, "City Mood"),
                "City Mood",
                7990,
                4.4,
                "Комфортная посадка, много отзывов про маломерку.",
                List.of("M", "L", "XL")
        ));

        if (marketplaceFilter != null && !marketplaceFilter.isBlank()) {
            return items.stream()
                    .filter(item -> marketplaceFilter.equalsIgnoreCase(String.valueOf(item.get("marketplace"))))
                    .toList();
        }
        return items;
    }

    private static String titleFor(String category, String brand) {
        return switch (category) {
            case "jacket" -> "Пиджак oversize · " + brand;
            case "dress" -> "Платье миди · " + brand;
            case "pants" -> "Брюки straight · " + brand;
            case "shoes" -> "Кроссовки city · " + brand;
            case "top" -> "Блуза minimal · " + brand;
            default -> "Look item · " + brand;
        };
    }

    private Map<String, Object> product(
            String id,
            String marketplace,
            String title,
            String brand,
            int priceRub,
            double rating,
            String description,
            List<String> sizes
    ) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", id);
        map.put("marketplace", marketplace);
        map.put("title", title);
        map.put("brand", brand);
        map.put("priceRub", priceRub);
        map.put("rating", rating);
        map.put("description", description);
        map.put("imageUrl", "/assets/demo-garment.svg");
        map.put("sizes", sizes);
        map.put("productUrl", "https://www." + marketplace + ".ru/catalog/" + id);
        return map;
    }
}
