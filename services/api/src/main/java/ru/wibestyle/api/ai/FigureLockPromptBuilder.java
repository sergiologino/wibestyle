package ru.wibestyle.api.ai;

import ru.wibestyle.api.domain.AvatarSnapshotEntity;
import ru.wibestyle.api.marketplace.ProductSizeChart;
import ru.wibestyle.api.marketplace.SizeChartEntry;

/**
 * Figure preservation block for the virtual try-on prompt.
 */
public final class FigureLockPromptBuilder {

    private FigureLockPromptBuilder() {
    }

    public static String build(AvatarSnapshotEntity snapshot, String selectedGarmentSize, ProductSizeChart sellerChart) {
        if (snapshot == null) {
            return "";
        }
        StringBuilder builder = new StringBuilder();
        builder.append("FIGURE LOCK, HIGH PRIORITY: image1 is the only body and proportions reference. ");
        builder.append("Match the generated person to the visible silhouette in image1 and to the customer's measurements: ");
        appendMetrics(builder, snapshot);
        builder.append("FORBIDDEN: shrinking the bust, hips or waist, slimming the person by 1-2 sizes, ");
        builder.append("or replacing image1 proportions with catalog model proportions. ");
        if (snapshot.getBustCm() != null && snapshot.getBustCm() >= 94) {
            builder.append("Full bust (")
                    .append(snapshot.getBustCm())
                    .append(" cm): preserve the same bust volume and shape as in image1. ");
        }
        if (selectedGarmentSize != null && !selectedGarmentSize.isBlank()) {
            builder.append("The marketplace label size ").append(selectedGarmentSize)
                    .append(" must not narrow the body; show tight fabric if needed, while the body remains unchanged. ");
        }
        appendSellerChartHint(builder, selectedGarmentSize, sellerChart);
        builder.append("Repeat: bust, waist, hips, shoulders and limb proportions must match image1 and the measurements.");
        return builder.toString().replaceAll("\\s+", " ").trim();
    }

    private static void appendMetrics(StringBuilder builder, AvatarSnapshotEntity snapshot) {
        if (snapshot.getHeightCm() != null) {
            builder.append("height ").append(snapshot.getHeightCm()).append(" cm, ");
        }
        if (snapshot.getBustCm() != null) {
            builder.append("bust ").append(snapshot.getBustCm()).append(" cm, ");
        }
        if (snapshot.getWaistCm() != null) {
            builder.append("waist ").append(snapshot.getWaistCm()).append(" cm, ");
        }
        if (snapshot.getHipsCm() != null) {
            builder.append("hips ").append(snapshot.getHipsCm()).append(" cm, ");
        }
        if (snapshot.getClothingSize() != null && !snapshot.getClothingSize().isBlank()) {
            builder.append("usual clothing size ").append(snapshot.getClothingSize().trim()).append(", ");
        }
    }

    private static void appendSellerChartHint(StringBuilder builder, String selectedSize, ProductSizeChart chart) {
        if (chart == null || !chart.found() || selectedSize == null) {
            return;
        }
        for (SizeChartEntry entry : chart.entries()) {
            if (!sizeLabelMatches(selectedSize, entry.label())) {
                continue;
            }
            if (entry.bustMaxCm() != null) {
                builder.append("In the seller size chart, ").append(entry.label())
                        .append(" fits bust up to ").append(entry.bustMaxCm()).append(" cm; ")
                        .append("on a fuller figure the garment may look tight, but the body must not be reduced. ");
            }
            return;
        }
    }

    private static boolean sizeLabelMatches(String selected, String chartLabel) {
        if (selected == null || chartLabel == null) {
            return false;
        }
        return selected.trim().equalsIgnoreCase(chartLabel.trim());
    }
}
