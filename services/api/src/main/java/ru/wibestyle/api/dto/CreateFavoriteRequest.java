package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.UUID;

public record CreateFavoriteRequest(
        @NotBlank String marketplace,
        @NotBlank String externalProductId,
        String title,
        String brand,
        Integer priceRub,
        String imageUrl,
        String productUrl,
        UUID tryOnSessionId,
        List<String> sizes,
        String note,
        String tags
) {
}
