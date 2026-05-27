package ru.wibestyle.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateReviewRequest(
        UUID tryOnSessionId,
        @Min(1) @Max(5) int rating,
        @NotBlank @Size(max = 2000) String body,
        String displayName,
        boolean allowPublish
) {
}
