package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record SizeAdviceRequest(
        @NotBlank String marketplace,
        String externalProductId,
        String productUrl,
        @NotBlank String selectedSize,
        List<String> availableSizes,
        List<String> reviewSignals
) {
}
