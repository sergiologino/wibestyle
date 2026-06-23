package ru.wibestyle.api.ai;

import org.springframework.stereotype.Component;
import ru.wibestyle.api.domain.AvatarSnapshotEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.marketplace.ProductSizeChart;
import ru.wibestyle.api.marketplace.SizeChartFitMatcher;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Compares avatar figure measurements with marketplace garment label size.
 */
@Component
public class GarmentFitAnalyzer {

    private static final Pattern EU_SIZE = Pattern.compile("(\\d{2})");
    private static final String[] LETTER_ORDER = {"XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"};

    public GarmentFitAssessment analyze(
            TryOnSessionEntity session,
            AvatarSnapshotEntity snapshot,
            ProductSizeChart sellerChart
    ) {
        String selected = session.getSelectedSize();
        if (selected == null || selected.isBlank()) {
            return GarmentFitAssessment.ok(null, null);
        }

        List<String> available = parseAvailableSizes(session.getProductSizes());
        ProductSizeChart chart = sellerChart == null ? ProductSizeChart.empty() : sellerChart;

        if (chart.found()) {
            return analyzeWithSellerChart(snapshot, chart, selected, available);
        }

        int avatarIndex = resolveAvatarSizeIndex(snapshot);
        int garmentIndex = resolveGarmentSizeIndex(selected);
        if (garmentIndex < 0) {
            return GarmentFitAssessment.ok(selected, buildFitPromptHint(snapshot, selected, selected, 0, false, chart));
        }

        int gap = avatarIndex - garmentIndex;
        String recommended = pickRecommendedSize(available, avatarIndex, garmentIndex);

        if (gap >= 2) {
            String hint = buildFitPromptHint(snapshot, selected, recommended, gap, true, chart);
            return GarmentFitAssessment.tooSmall(selected, recommended, gap, hint);
        }
        if (gap == 1) {
            String hint = buildFitPromptHint(snapshot, selected, recommended, gap, false, chart);
            return GarmentFitAssessment.tight(selected, recommended, gap, hint);
        }
        return GarmentFitAssessment.ok(selected, buildFitPromptHint(snapshot, selected, selected, 0, false, chart));
    }

    private GarmentFitAssessment analyzeWithSellerChart(
            AvatarSnapshotEntity snapshot,
            ProductSizeChart chart,
            String selected,
            List<String> available
    ) {
        String chartRecommended = SizeChartFitMatcher.recommend(chart, snapshot, available).orElse(null);
        boolean tooSmall = SizeChartFitMatcher.isTooSmallForAvatar(chart, snapshot, selected);
        if (tooSmall && chartRecommended != null && !chartRecommended.equalsIgnoreCase(selected)) {
            String hint = buildFitPromptHint(snapshot, selected, chartRecommended, 2, true, chart);
            return GarmentFitAssessment.tooSmall(selected, chartRecommended, 2, hint);
        }
        if (chartRecommended != null && !chartRecommended.equalsIgnoreCase(selected)) {
            int selectedIndex = resolveGarmentSizeIndex(selected);
            int recommendedIndex = resolveGarmentSizeIndex(chartRecommended);
            int gap = selectedIndex >= 0 && recommendedIndex >= 0 ? recommendedIndex - selectedIndex : 1;
            if (gap > 0) {
                String hint = buildFitPromptHint(snapshot, selected, chartRecommended, gap, gap >= 2, chart);
                return gap >= 2
                        ? GarmentFitAssessment.tooSmall(selected, chartRecommended, gap, hint)
                        : GarmentFitAssessment.tight(selected, chartRecommended, gap, hint);
            }
        }
        return GarmentFitAssessment.ok(selected, buildFitPromptHint(snapshot, selected, selected, 0, false, chart));
    }

    private static String buildFitPromptHint(
            AvatarSnapshotEntity snapshot,
            String selectedSize,
            String recommendedSize,
            int gap,
            boolean clearlyTooSmall,
            ProductSizeChart sellerChart
    ) {
        StringBuilder builder = new StringBuilder();
        appendFigureBlock(builder, snapshot);
        builder.append(" Marketplace label size on the product card: ").append(selectedSize).append('.');
        if (recommendedSize != null && !recommendedSize.equalsIgnoreCase(selectedSize)) {
            builder.append(" For this body, size ").append(selectedSize)
                    .append(" is realistically small; size ").append(recommendedSize)
                    .append(" would fit the bust and hips better.");
        }
        if (sellerChart != null && sellerChart.found()) {
            builder.append(" Use the seller size chart from the product card in centimeters, not generic mannequin sizing.");
        }
        if (clearlyTooSmall) {
            builder.append(
                    " IMPORTANT FIT INSTRUCTION: preserve the full bust and hip volume from image1; do not slim the body."
                            + " Show the garment as visibly tight or undersized on the unchanged body using fabric tension,"
                            + " not by reducing the silhouette."
                            + " Do not turn an EU 50-52 body into an EU 44-46 body."
                            + " Bust and hips in the frame must match image1 and the measurements above."
            );
        } else if (gap == 1) {
            builder.append(
                    " Preserve the natural bust and hip volume; the garment may fit closely, but it must not compress or shrink the silhouette."
            );
        } else {
            builder.append(
                    " Preserve bust, waist and hip proportions from image1; do not slim, average or generalize the body."
            );
        }
        return builder.toString().replaceAll("\\s+", " ").trim();
    }

    private static void appendFigureBlock(StringBuilder builder, AvatarSnapshotEntity snapshot) {
        builder.append(" Customer usual clothing size:");
        if (snapshot.getClothingSize() != null && !snapshot.getClothingSize().isBlank()) {
            builder.append(' ').append(snapshot.getClothingSize().trim());
        }
        builder.append('.');
        if (snapshot.getHeightCm() != null) {
            builder.append(" Height ").append(snapshot.getHeightCm()).append(" cm.");
        }
        if (snapshot.getBustCm() != null) {
            builder.append(" Bust ").append(snapshot.getBustCm()).append(" cm.");
        }
        if (snapshot.getWaistCm() != null) {
            builder.append(" Waist ").append(snapshot.getWaistCm()).append(" cm.");
        }
        if (snapshot.getHipsCm() != null) {
            builder.append(" Hips ").append(snapshot.getHipsCm()).append(" cm.");
        }
    }

    private static int resolveAvatarSizeIndex(AvatarSnapshotEntity snapshot) {
        int fromLabel = indexFromClothingLabel(snapshot.getClothingSize());
        int fromBust = indexFromBust(snapshot.getBustCm());
        int fromHips = indexFromHips(snapshot.getHipsCm());
        return Math.max(fromLabel, Math.max(fromBust, fromHips));
    }

    private static int indexFromClothingLabel(String clothingSize) {
        if (clothingSize == null || clothingSize.isBlank()) {
            return -1;
        }
        String normalized = clothingSize.trim().toUpperCase(Locale.ROOT);
        int letter = letterToIndex(normalized);
        if (letter >= 0) {
            return letter;
        }
        Matcher matcher = EU_SIZE.matcher(normalized);
        if (matcher.find()) {
            return euToLetterIndex(Integer.parseInt(matcher.group(1)));
        }
        return -1;
    }

    private static int indexFromBust(Integer bustCm) {
        if (bustCm == null) return -1;
        if (bustCm >= 108) return 7;
        if (bustCm >= 102) return 6;
        if (bustCm >= 96) return 5;
        if (bustCm >= 90) return 4;
        if (bustCm >= 84) return 3;
        if (bustCm >= 78) return 2;
        if (bustCm >= 72) return 1;
        return 0;
    }

    private static int indexFromHips(Integer hipsCm) {
        if (hipsCm == null) return -1;
        if (hipsCm >= 112) return 7;
        if (hipsCm >= 106) return 6;
        if (hipsCm >= 100) return 5;
        if (hipsCm >= 94) return 4;
        if (hipsCm >= 88) return 3;
        if (hipsCm >= 82) return 2;
        if (hipsCm >= 76) return 1;
        return 0;
    }

    private static int resolveGarmentSizeIndex(String selectedSize) {
        String normalized = selectedSize.trim().toUpperCase(Locale.ROOT);
        int letter = letterToIndex(normalized);
        if (letter >= 0) {
            return letter;
        }
        Matcher matcher = EU_SIZE.matcher(normalized);
        if (matcher.find()) {
            return euToLetterIndex(Integer.parseInt(matcher.group(1)));
        }
        return -1;
    }

    private static int letterToIndex(String normalized) {
        String compact = normalized.replace(" ", "");
        if (compact.equals("2XL") || compact.equals("XXL")) return 6;
        if (compact.equals("3XL") || compact.equals("XXXL")) return 7;
        for (int i = LETTER_ORDER.length - 1; i >= 0; i--) {
            if (compact.equals(LETTER_ORDER[i])) {
                return i;
            }
        }
        return -1;
    }

    private static int euToLetterIndex(int eu) {
        if (eu >= 56) return 7;
        if (eu >= 54) return 6;
        if (eu >= 52) return 5;
        if (eu >= 50) return 4;
        if (eu >= 48) return 3;
        if (eu >= 46) return 2;
        if (eu >= 44) return 1;
        return 0;
    }

    private static String pickRecommendedSize(List<String> available, int avatarIndex, int garmentIndex) {
        if (available.isEmpty()) {
            return indexToLetter(Math.max(avatarIndex, garmentIndex + 1));
        }
        int target = Math.max(avatarIndex, garmentIndex + 1);
        String best = null;
        int bestDistance = Integer.MAX_VALUE;
        for (String size : available) {
            int idx = resolveGarmentSizeIndex(size);
            if (idx < 0) {
                continue;
            }
            if (idx >= target && idx - target < bestDistance) {
                bestDistance = idx - target;
                best = size;
            }
        }
        if (best != null) {
            return best;
        }
        return available.stream()
                .max(Comparator.comparingInt(GarmentFitAnalyzer::resolveGarmentSizeIndex))
                .orElse(available.get(available.size() - 1));
    }

    private static String indexToLetter(int index) {
        int clamped = Math.min(Math.max(index, 0), LETTER_ORDER.length - 1);
        return LETTER_ORDER[clamped];
    }

    private static List<String> parseAvailableSizes(String rawJson) {
        if (rawJson == null || rawJson.isBlank()) {
            return List.of();
        }
        String trimmed = rawJson.trim();
        if (!trimmed.startsWith("[")) {
            return List.of();
        }
        List<String> sizes = new ArrayList<>();
        for (String part : trimmed.replace("[", "").replace("]", "").replace("\"", "").split(",")) {
            String size = part.trim();
            if (!size.isBlank()) {
                sizes.add(size);
            }
        }
        return sizes;
    }

    public record GarmentFitAssessment(
            String status,
            String selectedSize,
            String recommendedSize,
            int sizeGap,
            String fitPromptHint,
            boolean suggestAlternateSize
    ) {
        static GarmentFitAssessment ok(String selected, String hint) {
            return new GarmentFitAssessment("ok", selected, null, 0, hint, false);
        }

        static GarmentFitAssessment tight(String selected, String recommended, int gap, String hint) {
            return new GarmentFitAssessment("tight", selected, recommended, gap, hint, recommended != null);
        }

        static GarmentFitAssessment tooSmall(String selected, String recommended, int gap, String hint) {
            return new GarmentFitAssessment("too_small", selected, recommended, gap, hint, recommended != null);
        }
    }
}
