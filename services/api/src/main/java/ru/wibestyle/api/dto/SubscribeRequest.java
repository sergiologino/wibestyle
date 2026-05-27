package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;

public record SubscribeRequest(
        @NotBlank String plan,
        @NotBlank String period
) {
}
