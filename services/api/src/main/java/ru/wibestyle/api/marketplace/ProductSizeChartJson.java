package ru.wibestyle.api.marketplace;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class ProductSizeChartJson {

    private ProductSizeChartJson() {
    }

    public static String serialize(ObjectMapper mapper, ProductSizeChart chart) {
        if (chart == null || !chart.found()) {
            return null;
        }
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("found", true);
            payload.put("source", chart.source());
            List<Map<String, Object>> rows = new ArrayList<>();
            for (SizeChartEntry entry : chart.entries()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("label", entry.label());
                row.put("bustMinCm", entry.bustMinCm());
                row.put("bustMaxCm", entry.bustMaxCm());
                row.put("waistMinCm", entry.waistMinCm());
                row.put("waistMaxCm", entry.waistMaxCm());
                row.put("hipsMinCm", entry.hipsMinCm());
                row.put("hipsMaxCm", entry.hipsMaxCm());
                rows.add(row);
            }
            payload.put("entries", rows);
            return mapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            return null;
        }
    }

    public static ProductSizeChart deserialize(ObjectMapper mapper, String raw) {
        if (raw == null || raw.isBlank()) {
            return ProductSizeChart.empty();
        }
        try {
            var node = mapper.readTree(raw);
            if (!node.path("found").asBoolean(false)) {
                return ProductSizeChart.empty();
            }
            String source = node.path("source").asText(null);
            List<SizeChartEntry> entries = new ArrayList<>();
            for (var row : node.path("entries")) {
                entries.add(new SizeChartEntry(
                        row.path("label").asText(null),
                        intOrNull(row, "bustMinCm"),
                        intOrNull(row, "bustMaxCm"),
                        intOrNull(row, "waistMinCm"),
                        intOrNull(row, "waistMaxCm"),
                        intOrNull(row, "hipsMinCm"),
                        intOrNull(row, "hipsMaxCm")
                ));
            }
            return new ProductSizeChart(true, source, entries);
        } catch (JsonProcessingException ex) {
            return ProductSizeChart.empty();
        }
    }

    private static Integer intOrNull(com.fasterxml.jackson.databind.JsonNode row, String field) {
        if (!row.has(field) || row.get(field).isNull()) {
            return null;
        }
        return row.get(field).asInt();
    }
}
