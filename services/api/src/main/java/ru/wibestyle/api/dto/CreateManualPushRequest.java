package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CreateManualPushRequest(
        @NotBlank @Size(max = 80) String title,
        @NotBlank @Size(max = 240) String body,
        @NotBlank @Size(max = 32) String audience,
        @NotNull Instant scheduledAt,
        @Size(max = 512) String actionUrl
) {
}
