package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;

public record SearchRequest(
        @NotBlank String query,
        String marketplace
) {
}
