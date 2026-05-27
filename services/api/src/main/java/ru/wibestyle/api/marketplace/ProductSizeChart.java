package ru.wibestyle.api.marketplace;

import java.util.List;

public record ProductSizeChart(
        boolean found,
        String source,
        List<SizeChartEntry> entries
) {
    public static ProductSizeChart empty() {
        return new ProductSizeChart(false, null, List.of());
    }
}
