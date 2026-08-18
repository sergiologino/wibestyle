package ru.wibestyle.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record UpdatePromoRequest(
        @Min(1) @Max(90) int discountPercent,
        @Min(1) int maxUses,
        @NotNull Instant expiresAt,
        String label
) {
}
