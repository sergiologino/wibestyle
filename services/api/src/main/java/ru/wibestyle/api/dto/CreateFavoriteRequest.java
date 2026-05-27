package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record CreateFavoriteRequest(
        @NotBlank String marketplace,
        @NotBlank String externalProductId,
        String title,
        String brand,
        Integer priceRub,
        String imageUrl,
        String productUrl,
        List<String> sizes,
        String note,
        String tags
) {
}
