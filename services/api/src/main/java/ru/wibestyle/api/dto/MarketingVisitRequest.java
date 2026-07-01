package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record MarketingVisitRequest(
        @NotBlank @Size(max = 64) String visitorId,
        MarketingTouchRequest firstTouch,
        MarketingTouchRequest lastTouch,
        Instant createdAt,
        Instant updatedAt
) {
}
