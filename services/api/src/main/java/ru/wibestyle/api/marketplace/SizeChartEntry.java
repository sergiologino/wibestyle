package ru.wibestyle.api.marketplace;

/**
 * One row of a seller size chart (label S/M/L or EU 46 with measurement ranges in cm).
 */
public record SizeChartEntry(
        String label,
        Integer bustMinCm,
        Integer bustMaxCm,
        Integer waistMinCm,
        Integer waistMaxCm,
        Integer hipsMinCm,
        Integer hipsMaxCm
) {
}
