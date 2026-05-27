package ru.wibestyle.api.marketplace;

import ru.wibestyle.api.domain.AvatarSnapshotEntity;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Picks optimal marketplace size label using seller size chart + avatar measurements.
 */
public final class SizeChartFitMatcher {

    private SizeChartFitMatcher() {
    }

    public static Optional<String> recommend(
            ProductSizeChart chart,
            AvatarSnapshotEntity snapshot,
            List<String> availableSizes
    ) {
        if (chart == null || !chart.found() || chart.entries().isEmpty()) {
            return Optional.empty();
        }
        List<Scored> scored = new ArrayList<>();
        for (SizeChartEntry entry : chart.entries()) {
            if (!matchesAvailable(entry.label(), availableSizes)) {
                continue;
            }
            int score = scoreEntry(entry, snapshot);
            if (score > 0) {
                scored.add(new Scored(resolveAvailableLabel(entry.label(), availableSizes), score));
            }
        }
        return scored.stream()
                .max(Comparator.comparingInt(Scored::score))
                .map(Scored::label);
    }

    public static boolean isTooSmallForAvatar(
            ProductSizeChart chart,
            AvatarSnapshotEntity snapshot,
            String selectedSize
    ) {
        if (chart == null || !chart.found() || selectedSize == null) {
            return false;
        }
        Integer bust = snapshot.getBustCm();
        Integer hips = snapshot.getHipsCm();
        for (SizeChartEntry entry : chart.entries()) {
            if (!sizeLabelMatches(selectedSize, entry.label())) {
                continue;
            }
            if (bust != null && entry.bustMaxCm() != null && bust > entry.bustMaxCm() + 2) {
                return true;
            }
            if (hips != null && entry.hipsMaxCm() != null && hips > entry.hipsMaxCm() + 2) {
                return true;
            }
            return false;
        }
        return false;
    }

    private static int scoreEntry(SizeChartEntry entry, AvatarSnapshotEntity snapshot) {
        int score = 0;
        score += rangeScore(snapshot.getBustCm(), entry.bustMinCm(), entry.bustMaxCm(), 4);
        score += rangeScore(snapshot.getWaistCm(), entry.waistMinCm(), entry.waistMaxCm(), 2);
        score += rangeScore(snapshot.getHipsCm(), entry.hipsMinCm(), entry.hipsMaxCm(), 3);
        return score;
    }

    private static int rangeScore(Integer actual, Integer min, Integer max, int weight) {
        if (actual == null || min == null || max == null) {
            return 0;
        }
        if (actual >= min && actual <= max) {
            return weight * 3;
        }
        if (actual < min && actual >= min - 4) {
            return weight;
        }
        if (actual > max && actual <= max + 4) {
            return weight;
        }
        return 0;
    }

    private static boolean matchesAvailable(String chartLabel, List<String> available) {
        if (available == null || available.isEmpty()) {
            return true;
        }
        return available.stream().anyMatch(size -> sizeLabelMatches(size, chartLabel));
    }

    private static String resolveAvailableLabel(String chartLabel, List<String> available) {
        if (available == null) {
            return chartLabel;
        }
        return available.stream()
                .filter(size -> sizeLabelMatches(size, chartLabel))
                .findFirst()
                .orElse(chartLabel);
    }

    private static boolean sizeLabelMatches(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        return a.trim().equalsIgnoreCase(b.trim());
    }

    private record Scored(String label, int score) {
    }
}
