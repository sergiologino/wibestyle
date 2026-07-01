package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record MarketingEventRequest(
        @Size(max = 64) String visitorId,
        @NotBlank @Size(max = 50) String eventType,
        Map<String, Object> metadata
) {
}
