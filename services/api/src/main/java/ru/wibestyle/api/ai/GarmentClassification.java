package ru.wibestyle.api.ai;

import java.util.Map;
import java.util.Set;

public record GarmentClassification(String category, String title, String source) {

    private static final Set<String> ALLOWED = Set.of(
            "dress", "top", "pants", "jacket", "shoes", "accessory", "other"
    );

    public GarmentClassification {
        category = normalizeCategory(category);
        title = normalizeTitle(title);
        source = source == null || source.isBlank() ? "fallback" : source;
    }

    public Map<String, Object> toMap() {
        return Map.of(
                "category", category,
                "title", title,
                "source", source
        );
    }

    public static String normalizeCategory(String raw) {
        if (raw == null || raw.isBlank()) {
            return "other";
        }
        String normalized = raw.trim().toLowerCase();
        return ALLOWED.contains(normalized) ? normalized : "other";
    }

    public static String normalizeTitle(String raw) {
        if (raw == null || raw.isBlank()) {
            return "Одежда";
        }
        String trimmed = raw.trim().replaceAll("\\s+", " ");
        if (trimmed.length() > 80) {
            return trimmed.substring(0, 80).trim();
        }
        return trimmed;
    }
}
