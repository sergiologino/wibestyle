package ru.wibestyle.api.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import ru.wibestyle.api.domain.AvatarSnapshotEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.marketplace.ProductSizeChart;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Builds the variable JSON block appended after the admin-editable Russian base prompt.
 */
public final class TryOnPromptVariablesBuilder {

    private TryOnPromptVariablesBuilder() {
    }

    public static String buildJsonBlock(
            ObjectMapper objectMapper,
            TryOnSessionEntity session,
            AvatarSnapshotEntity snapshot,
            String faceLock,
            String figureLock,
            String fitHint,
            ProductSizeChart chart
    ) {
        Map<String, Object> root = new LinkedHashMap<>();
        root.put("product", productBlock(session));
        root.put("customer", customerBlock(snapshot));
        if (faceLock != null && !faceLock.isBlank()) {
            root.put("faceLock", faceLock);
        }
        if (figureLock != null && !figureLock.isBlank()) {
            root.put("figureLock", figureLock);
        }
        if (fitHint != null && !fitHint.isBlank()) {
            root.put("fitHint", fitHint);
        }
        if (chart != null && chart.found()) {
            root.put("sellerSizeChart", chart.entries().stream()
                    .map(e -> Map.of(
                            "label", e.label(),
                            "bustMaxCm", e.bustMaxCm() != null ? e.bustMaxCm() : "",
                            "waistMaxCm", e.waistMaxCm() != null ? e.waistMaxCm() : "",
                            "hipsMaxCm", e.hipsMaxCm() != null ? e.hipsMaxCm() : ""
                    ))
                    .toList());
        }
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(root);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize try-on prompt variables", ex);
        }
    }

    private static Map<String, Object> productBlock(TryOnSessionEntity session) {
        Map<String, Object> product = new LinkedHashMap<>();
        if (session.getProductBrand() != null && !session.getProductBrand().isBlank()) {
            product.put("brand", session.getProductBrand().trim());
        }
        if (session.getProductTitle() != null && !session.getProductTitle().isBlank()) {
            product.put("title", GarmentTitleSanitizer.forPrompt(session.getProductTitle().trim()));
        }
        if (session.getGarmentCategory() != null && !session.getGarmentCategory().isBlank()) {
            product.put("category", session.getGarmentCategory().trim());
        }
        if (session.getSelectedSize() != null && !session.getSelectedSize().isBlank()) {
            product.put("marketplaceLabelSize", session.getSelectedSize().trim());
        }
        return product;
    }

    private static Map<String, Object> customerBlock(AvatarSnapshotEntity snapshot) {
        Map<String, Object> customer = new LinkedHashMap<>();
        if (snapshot == null) {
            return customer;
        }
        if (snapshot.getHeightCm() != null) {
            customer.put("heightCm", snapshot.getHeightCm());
        }
        if (snapshot.getBustCm() != null) {
            customer.put("bustCm", snapshot.getBustCm());
        }
        if (snapshot.getWaistCm() != null) {
            customer.put("waistCm", snapshot.getWaistCm());
        }
        if (snapshot.getHipsCm() != null) {
            customer.put("hipsCm", snapshot.getHipsCm());
        }
        if (snapshot.getClothingSize() != null && !snapshot.getClothingSize().isBlank()) {
            customer.put("usualClothingSize", snapshot.getClothingSize().trim());
        }
        return customer;
    }
}
