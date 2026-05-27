package ru.wibestyle.api.marketplace;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
public class SizeChartExtractor {

    private final ProductPageSizeChartFetcher pageFetcher;

    public SizeChartExtractor(ProductPageSizeChartFetcher pageFetcher) {
        this.pageFetcher = pageFetcher;
    }

    public ProductSizeChart extract(String productUrl, JsonNode wbCard, String wbProductJsonText) {
        List<ProductSizeChart> candidates = new ArrayList<>();
        if (wbCard != null && !wbCard.isMissingNode()) {
            candidates.add(parseFromWbCard(wbCard));
            candidates.add(SizeChartTextParser.parse("wb_card_text", collectWbCardText(wbCard)));
        }
        if (wbProductJsonText != null && !wbProductJsonText.isBlank()) {
            candidates.add(SizeChartTextParser.parse("wb_product_json", wbProductJsonText));
        }
        candidates.add(pageFetcher.fetchFromProductPage(productUrl));
        for (ProductSizeChart chart : candidates) {
            if (chart.found() && !chart.entries().isEmpty()) {
                return chart;
            }
        }
        return ProductSizeChart.empty();
    }

    private static ProductSizeChart parseFromWbCard(JsonNode card) {
        List<SizeChartEntry> entries = new ArrayList<>();
        JsonNode sizes = card.path("sizes_table");
        if (sizes.isArray()) {
            for (JsonNode row : sizes) {
                SizeChartEntry entry = rowFromJson(row);
                if (entry != null) {
                    entries.add(entry);
                }
            }
        }
        JsonNode grouped = card.path("grouped_options");
        if (grouped.isArray()) {
            for (JsonNode group : grouped) {
                String name = group.path("name").asText("").toLowerCase(Locale.ROOT);
                if (!name.contains("размер") && !name.contains("обхват")) {
                    continue;
                }
                JsonNode options = group.path("options");
                if (options.isArray()) {
                    for (JsonNode opt : options) {
                        String text = opt.asText("");
                        ProductSizeChart parsed = SizeChartTextParser.parse("wb_grouped_options", text);
                        if (parsed.found()) {
                            return parsed;
                        }
                    }
                }
            }
        }
        if (entries.isEmpty()) {
            return ProductSizeChart.empty();
        }
        return new ProductSizeChart(true, "wb_card_sizes_table", entries);
    }

    private static SizeChartEntry rowFromJson(JsonNode row) {
        String label = firstText(row, "size", "tech_size", "wb_size", "name");
        if (label == null) {
            return null;
        }
        return new SizeChartEntry(
                label.toUpperCase(Locale.ROOT),
                intField(row, "bust_min", "chest_min"),
                intField(row, "bust_max", "chest_max"),
                intField(row, "waist_min"),
                intField(row, "waist_max"),
                intField(row, "hips_min", "hip_min"),
                intField(row, "hips_max", "hip_max")
        );
    }

    private static String collectWbCardText(JsonNode card) {
        StringBuilder builder = new StringBuilder();
        for (String field : List.of("description", "markdown_description", "imt_descr", "contents", "options")) {
            String value = card.path(field).asText("");
            if (!value.isBlank()) {
                builder.append(value).append('\n');
            }
        }
        JsonNode options = card.path("options");
        if (options.isArray()) {
            for (JsonNode opt : options) {
                builder.append(opt.path("name").asText(""))
                        .append(' ')
                        .append(opt.path("value").asText(""))
                        .append('\n');
            }
        }
        return builder.toString();
    }

    private static String firstText(JsonNode node, String... fields) {
        for (String field : fields) {
            String value = node.path(field).asText(null);
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private static Integer intField(JsonNode node, String... fields) {
        for (String field : fields) {
            if (node.has(field) && node.get(field).isNumber()) {
                return node.get(field).asInt();
            }
            String text = node.path(field).asText(null);
            if (text != null && text.matches("\\d+")) {
                return Integer.parseInt(text);
            }
        }
        return null;
    }
}
